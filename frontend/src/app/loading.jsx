import LoadingTips from "../components/LoadingTips";
import base from "../components/status.module.css";
import styles from "../components/Loading.module.css";

export default function Loading() {
  return (
    <div className={`${base.page} ${styles.wrapper}`}>
      <div className={styles.loader} role="status" aria-live="polite">
        <div className={styles.art} aria-hidden="true">
          <svg viewBox="-4 -12 108 92">
            <path className={styles.flip} d="M52 42 Q75 34 98 40 L98 74 Q75 70 52 76 Z" />
            <path className={styles.pageLeft} d="M2 40 Q25 34 48 42 L48 76 Q25 70 2 74 Z" />
            <path className={styles.pageRight} d="M52 42 Q75 34 98 40 L98 74 Q75 70 52 76 Z" />
            <path className={styles.base} d="M6 26 L32 15 L46 21 L80 1" />

            <path
              id="edutrack-trend"
              className={styles.line}
              pathLength={100}
              strokeDasharray="100"
              strokeDashoffset="100"
              d="M6 26 L32 15 L46 21 L80 1"
            >
              <animate
                attributeName="stroke-dashoffset"
                values="100;0;0"
                keyTimes="0;.75;1"
                dur="2s"
                repeatCount="indefinite"
              />
            </path>
            <g>
              <circle className={styles.halo} r="7">
                <animate attributeName="r" values="7;7;14" keyTimes="0;.75;1" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0;.35;0" keyTimes="0;.75;1" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle className={styles.dot} r="7" />
              <animateMotion
                dur="2s"
                repeatCount="indefinite"
                keyPoints="0;1;1"
                keyTimes="0;.75;1"
                calcMode="linear"
              >
                <mpath href="#edutrack-trend" />
              </animateMotion>
            </g>
          </svg>
        </div>

        <div className={styles.brandName}>
          Edu<span className={base.accent}>Track</span>Pro
        </div>
        <div className={styles.label}>
          Carregando
          <span className={styles.dots} aria-hidden="true">
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </span>
        </div>
        <LoadingTips />
        <div className={styles.bar} aria-hidden="true" />
      </div>
    </div>
  );
}
