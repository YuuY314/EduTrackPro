"use client";

import { useRouter } from "next/navigation";
import styles from "./status.module.css";

export default function BackButton() {
  const router = useRouter();

  function handleClick() {
    if (window.history.length > 1) router.back();
    else router.push("/");
  }

  return (
    <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={handleClick}>
      Página anterior
    </button>
  );
}
