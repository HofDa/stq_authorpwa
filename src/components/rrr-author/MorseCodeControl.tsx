import { MorseCodeInput } from '@/components/rrr-runtime/MorseCodeInput';

interface MorseCodeControlProps {
  value: string;
  expectedPattern: string;
  shortAudioUrl: string;
  longAudioUrl: string;
  onValueChange: (value: string) => void;
}

export function MorseCodeControl({
  value,
  expectedPattern,
  shortAudioUrl,
  longAudioUrl,
  onValueChange,
}: MorseCodeControlProps) {
  return (
    <MorseCodeInput
      value={value}
      expectedPattern={expectedPattern}
      shortAudioUrl={shortAudioUrl}
      longAudioUrl={longAudioUrl}
      onValueChange={onValueChange}
      title="Morsecode testen"
      eyebrow="Morsecode"
      playLabel="Code abspielen"
      shortLabel="Kurz"
      longLabel="Lang"
      clearLabel="Leeren"
    />
  );
}
