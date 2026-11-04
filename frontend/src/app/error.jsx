"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BrandLogo from "../components/BrandLogo";
import base from "../components/status.module.css";
import styles from "../components/Error.module.css";

export default function ErrorPage({ error, reset }) {
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
   
    console.error(error);
  }, [error]);

  function handleRetry() {
    setRetrying(true);
    setTimeout(() => {
      reset();
      setRetrying(false);
    }, 600);
  }

  return (
    <div className={base.page}>
      <BrandLogo />

      <main className={base.main}>
        <div className={styles.scene} aria-hidden="true">
          <div className={styles.halo} />
          <svg viewBox="-10 -18 128 104">
            <g className={styles.book}>
              <path className={styles.pageLeft} d="M2 40 Q25 34 48 42 L48 76 Q25 70 2 74 Z" />
              <path className={styles.pageRight} d="M52 42 Q75 34 98 40 L98 74 Q75 70 52 76 Z" />
            </g>
            <path className={styles.up} d="M6 26 L32 15 L46 21 L66 6" />
            <path className={styles.crash} pathLength={100} d="M66 6 L82 34" />
            <circle className={styles.dot} cx="66" cy="6" r="6" />
            <line className={styles.spark} x1="86" y1="28" x2="94" y2="22" />
            <line className={styles.spark} x1="88" y1="34" x2="98" y2="34" />
            <line className={styles.spark} x1="78" y1="28" x2="72" y2="20" />
          </svg>
        </div>

        <span className={styles.badge}>ERRO INESPERADO</span>
        <h1 className={base.title}>Ops! Algo deu errado</h1>
        <p className={base.text}>
          Tivemos um problema ao carregar esta página. Já estamos cuidando disso. Tente novamente
          em instantes.
        </p>

        <div className={base.actions}>
          <button
            type="button"
            onClick={handleRetry}
            disabled={retrying}
            className={`${base.btn} ${base.btnPrimary} ${styles.retry} ${retrying ? styles.retrying : ""}`}
          >
            <svg
              className={styles.retryIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 12a9 9 0 1 1-3-6.7" />
              <path d="M21 3v6h-6" />
            </svg>
            Tentar novamente
          </button>
          <Link href="/" className={`${base.btn} ${base.btnGhost}`}>
            Voltar ao início
          </Link>
        </div>
      </main>
    </div>
  );
}
