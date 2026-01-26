import React from 'react';
import EmojiNoEntry from '@/assets/icons/EmojiNoEntry.svg';
import EmojiRedExclamationMark from '@/assets/icons/EmojiRedExclamationMark.svg';
import EmojiBell from '@/assets/icons/EmojiBell.svg';
import EmojiCheckMarkButton from '@/assets/icons/EmojiCheckMarkButton.svg';
import EmojiCrossmark from '@/assets/icons/EmojiCrossMark.svg';
import EmojiDoor from '@/assets/icons/EmojiDoor.svg';
import EmojiDove from '@/assets/icons/EmojiDove.svg';
import EmojiEnvelope from '@/assets/icons/EmojiEnvelope.svg';
import EmojiWavingHand from '@/assets/icons/EmojiWavingHand.svg';
import EmojiSadface from '@/assets/icons/EmojiSadface.svg';
import { SvgProps } from 'react-native-svg';

const emojiMap = {
  EmojiNoEntry,
  EmojiRedExclamationMark,
  EmojiBell,
  EmojiCheckMarkButton,
  EmojiCrossmark,
  EmojiDoor,
  EmojiDove,
  EmojiEnvelope,
  EmojiWavingHand,
  EmojiSadface,
} as const;

export type EmojiName = keyof typeof emojiMap;

export function isValidEmojiName(name: string): name is EmojiName {
  return name in emojiMap;
}

export function getEmojiComponentByName(name: EmojiName): React.FC<SvgProps> {
  return emojiMap[name];
}

export function renderEmoji(name: string, props?: SvgProps): React.ReactNode {
  if (isValidEmojiName(name)) {
    const Emoji = emojiMap[name];
    return React.createElement(Emoji, props);
  }
  return null;
}
