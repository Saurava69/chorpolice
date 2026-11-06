import test from 'node:test';
import assert from 'node:assert/strict';
import { ChorSipahiEngine } from './engine';
import { Player, Role } from './types';

function createMockPlayers(): Player[] {
  return [
    { id: 'p1', name: 'Aarav', avatar: '👑', score: 0 },
    { id: 'p2', name: 'Diya', avatar: '💎', score: 0 },
    { id: 'p3', name: 'Kabir', avatar: '⚔️', score: 0 },
    { id: 'p4', name: 'Meera', avatar: '🌸', score: 0 },
  ];
}

test('ChorSipahiEngine enforces exactly 4 players', () => {
  const threePlayers = createMockPlayers().slice(0, 3);
  assert.throws(() => {
    ChorSipahiEngine.createGame(threePlayers);
  }, /requires exactly 4 players/);

  const fourPlayers = createMockPlayers();
  const game = ChorSipahiEngine.createGame(fourPlayers);
  assert.equal(game.players.length, 4);
  assert.equal(game.status, 'WAITING');
  assert.equal(game.currentRoundNumber, 0);
});

test('ChorSipahiEngine assigns 4 unique roles to 4 players', () => {
  const game = ChorSipahiEngine.createGame(createMockPlayers());
  const round1 = ChorSipahiEngine.startNextRound(game);

  assert.equal(round1.currentRoundNumber, 1);
  assert.ok(round1.currentRound);
  assert.equal(round1.currentRound.phase, 'PRIVATE_REVEAL');

  const assignedRoles = Object.values(round1.currentRound.roles);
  assert.equal(assignedRoles.length, 4);

  const roleCounts: Record<Role, number> = {
    RAJA: 0,
    MANTRI: 0,
    SIPAHI: 0,
    CHOR: 0,
  };

  assignedRoles.forEach((role) => {
    roleCounts[role]++;
  });

  assert.equal(roleCounts.RAJA, 1, 'Exactly one Raja');
  assert.equal(roleCounts.MANTRI, 1, 'Exactly one Mantri');
  assert.equal(roleCounts.SIPAHI, 1, 'Exactly one Sipahi');
  assert.equal(roleCounts.CHOR, 1, 'Exactly one Chor');
});

test('Raja reveal phase moves to SIPAHI_GUESS', () => {
  const game = ChorSipahiEngine.createGame(createMockPlayers());
  const roundState = ChorSipahiEngine.startNextRound(game);

  const rajaId = Object.keys(roundState.currentRound!.roles).find(
    (id) => roundState.currentRound!.roles[id] === 'RAJA'
  )!;

  const afterRajaReveal = ChorSipahiEngine.revealRaja(roundState, rajaId);
  assert.equal(afterRajaReveal.currentRound!.phase, 'SIPAHI_GUESS');
  assert.equal(afterRajaReveal.currentRound!.revealedRajaPlayerId, rajaId);
});

test('Correct Sipahi guess awards 500 to Sipahi and 0 to Chor', () => {
  const game = ChorSipahiEngine.createGame(createMockPlayers());
  const roundState = ChorSipahiEngine.startNextRound(game);
  const roles = roundState.currentRound!.roles;

  const rajaId = Object.keys(roles).find((id) => roles[id] === 'RAJA')!;
  const mantriId = Object.keys(roles).find((id) => roles[id] === 'MANTRI')!;
  const sipahiId = Object.keys(roles).find((id) => roles[id] === 'SIPAHI')!;
  const chorId = Object.keys(roles).find((id) => roles[id] === 'CHOR')!;

  // Reveal Raja
  const readyForGuess = ChorSipahiEngine.revealRaja(roundState, rajaId);

  // Sipahi correctly guesses Chor
  const afterGuess = ChorSipahiEngine.submitGuess(readyForGuess, sipahiId, chorId);

  assert.equal(afterGuess.currentRound!.phase, 'RESULTS_REVEAL');
  assert.equal(afterGuess.currentRound!.guess?.isCorrect, true);

  const points = afterGuess.currentRound!.pointsAwarded;
  assert.equal(points[rajaId], 1000, 'Raja gets 1000');
  assert.equal(points[mantriId], 800, 'Mantri gets 800');
  assert.equal(points[sipahiId], 500, 'Sipahi gets 500 for correct guess');
  assert.equal(points[chorId], 0, 'Chor gets 0 when caught');

  // Check cumulative score
  const sipahiPlayer = afterGuess.players.find((p) => p.id === sipahiId)!;
  const chorPlayer = afterGuess.players.find((p) => p.id === chorId)!;
  assert.equal(sipahiPlayer.score, 500);
  assert.equal(chorPlayer.score, 0);
});

test('Incorrect Sipahi guess awards 0 to Sipahi and 500 to Chor', () => {
  const game = ChorSipahiEngine.createGame(createMockPlayers());
  const roundState = ChorSipahiEngine.startNextRound(game);
  const roles = roundState.currentRound!.roles;

  const rajaId = Object.keys(roles).find((id) => roles[id] === 'RAJA')!;
  const mantriId = Object.keys(roles).find((id) => roles[id] === 'MANTRI')!;
  const sipahiId = Object.keys(roles).find((id) => roles[id] === 'SIPAHI')!;
  const chorId = Object.keys(roles).find((id) => roles[id] === 'CHOR')!;

  const readyForGuess = ChorSipahiEngine.revealRaja(roundState, rajaId);

  // Sipahi incorrectly guesses Mantri
  const afterGuess = ChorSipahiEngine.submitGuess(readyForGuess, sipahiId, mantriId);

  assert.equal(afterGuess.currentRound!.phase, 'RESULTS_REVEAL');
  assert.equal(afterGuess.currentRound!.guess?.isCorrect, false);

  const points = afterGuess.currentRound!.pointsAwarded;
  assert.equal(points[rajaId], 1000, 'Raja gets 1000');
  assert.equal(points[mantriId], 800, 'Mantri gets 800');
  assert.equal(points[sipahiId], 0, 'Sipahi gets 0 for wrong guess');
  assert.equal(points[chorId], 500, 'Chor gets 500 for escaping');
});

test('Anti-cheating masking conceals hidden roles during guessing phase', () => {
  const game = ChorSipahiEngine.createGame(createMockPlayers());
  const roundState = ChorSipahiEngine.startNextRound(game);
  const roles = roundState.currentRound!.roles;

  const rajaId = Object.keys(roles).find((id) => roles[id] === 'RAJA')!;
  const sipahiId = Object.keys(roles).find((id) => roles[id] === 'SIPAHI')!;
  const chorId = Object.keys(roles).find((id) => roles[id] === 'CHOR')!;

  // Reveal Raja
  const readyForGuess = ChorSipahiEngine.revealRaja(roundState, rajaId);

  // Mask for Sipahi
  const sipahiView = ChorSipahiEngine.getMaskedRoundForViewer(
    readyForGuess.currentRound!,
    sipahiId
  );

  assert.equal(sipahiView.myRole, 'SIPAHI');
  // Sipahi can see themselves and the revealed Raja, but NOT Chor
  assert.ok(sipahiView.roles, 'roles property must be defined');
  assert.equal(sipahiView.roles[sipahiId], 'SIPAHI');
  assert.equal(sipahiView.roles[rajaId], 'RAJA');
  assert.equal(sipahiView.roles[chorId], undefined, 'Chor role must remain hidden!');
  assert.equal(sipahiView.visibleRoles[sipahiId], 'SIPAHI');
  assert.equal(sipahiView.visibleRoles[rajaId], 'RAJA');
  assert.equal(sipahiView.visibleRoles[chorId], undefined, 'Chor role must remain hidden!');

  // Test during RESULTS_REVEAL that all roles are included in roles
  const guessedState = ChorSipahiEngine.submitGuess(readyForGuess, sipahiId, chorId);
  const revealView = ChorSipahiEngine.getMaskedRoundForViewer(
    guessedState.currentRound!,
    sipahiId
  );
  assert.ok(revealView.roles, 'roles must exist in RESULTS_REVEAL');
  assert.equal(revealView.roles[chorId], 'CHOR');
  assert.equal(revealView.roles[rajaId], 'RAJA');
});
