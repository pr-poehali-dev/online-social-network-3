import Icon from "@/components/ui/icon";

export default function VerifiedBadge({ isVerified, isArtist }: { isVerified?: boolean; isArtist?: boolean }) {
  if (!isVerified && !isArtist) return null;
  return (
    <>
      {isVerified && <Icon name="BadgeCheck" size={14} className="text-primary" />}
      {isArtist && <span className="text-accent text-xs">🎵</span>}
    </>
  );
}
