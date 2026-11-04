import Link from "next/link";
import styles from "./status.module.css";

export default function BrandLogo() {
  return (
    <Link href="/" className={styles.brand} aria-label="EduTrackPro — início">
      <BrandIcon className={styles.brandIcon} />
      <span>
        Edu<span className={styles.accent}>Track</span>Pro
      </span>
    </Link>
  );
}

export function BrandIcon({ className }) {
  return (
    <svg className={className} viewBox="-4 -10 108 88" aria-hidden="true">
      <path
        className={styles.inkStroke}
        strokeWidth={7}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 26 L32 15 L46 21 L78 2"
      />
      <circle className={styles.blue} cx="82" cy="0" r="7" />
      <path className={styles.ink} d="M2 40 Q25 34 48 42 L48 76 Q25 70 2 74 Z" />
      <path className={styles.blue} d="M52 42 Q75 34 98 40 L98 74 Q75 70 52 76 Z" />
    </svg>
  );
}
