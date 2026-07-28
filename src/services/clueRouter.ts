import { getSocket } from './socket';
import cardsData from '../../assets/data/cards.json';
import { selectClues, Card, Clue } from '../utils/ClueService';

/** Register socket listeners for clue generation (host side) */
export function registerClueHandlers() {
  const socket = getSocket();

  // Client asks for clues for a specific card
  socket.on('requestClues', async (payload: { entityId: string }) => {
    try {
      const { entityId } = payload;
      // Find the card data
      const card: Card | undefined = (cardsData as Card[]).find((c) => c.entityId === entityId);
      if (!card) {
        socket.emit('cluesError', { entityId, message: 'Card not found' });
        return;
      }
      // Select dynamic clues according to rules
      const clues: Clue[] = await selectClues(card);
      // Emit clues to all participants (including host)
      socket.emit('clues', { entityId, clues });
    } catch (e) {
      console.error('Clue generation error', e);
      socket.emit('cluesError', { entityId: payload.entityId, message: (e as Error).message });
    }
  });
}
