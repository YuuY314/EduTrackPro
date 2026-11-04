import Link from "next/link";
import BrandLogo from "../components/BrandLogo";
import BackButton from "../components/BackButton";
import base from "../components/status.module.css";
import styles from "../components/NotFound.module.css";

export const metadata = {
  title: "Página não encontrada · EduTrackPro",
};

export default function NotFound() {
  return (
    <div className={base.page}>
      <BrandLogo />

      <main className={base.main}>
        <div className={styles.art} aria-hidden="true">
          <svg viewBox="-4 -24 124 104">
            <path className={styles.flip} d="M52 42 Q75 34 98 40 L98 74 Q75 70 52 76 Z" />
            <path className={styles.pageLeft} d="M2 40 Q25 34 48 42 L48 76 Q25 70 2 74 Z" />
            <path className={styles.pageRight} d="M52 42 Q75 34 98 40 L98 74 Q75 70 52 76 Z" />
            <path className={styles.line} pathLength={100} d="M6 26 L32 15 L46 21 L64 10" />
            <path className={styles.gap} d="M66 9 Q80 0 94 -6" />
            <g className={styles.lost}>
              <circle className={styles.dot} cx="100" cy="-8" r="7" />
              <text className={styles.question} x="108" y="-14">?</text>
            </g>
          </svg>
        </div>

        <div className={styles.code} aria-label="Erro 404">
          4<span className={styles.zero}>0</span>4
        </div>
        <h1 className={base.title}>Página não encontrada</h1>
        <p className={base.text}>
          A página que você procura saiu da trilha. Ela pode ter sido movida, removida ou o
          endereço está incorreto.
        </p>

        <div className={base.actions}>
          <Link href="/" className={`${base.btn} ${base.btnPrimary}`}>
            Voltar ao início
          </Link>
          <BackButton />
        </div>
      </main>
    </div>
  );
}
