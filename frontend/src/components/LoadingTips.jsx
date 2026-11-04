"use client";

import { useEffect, useState } from "react";
import styles from "./Loading.module.css";

const MESSAGES = [
  "Preparando seu painel",
  "Buscando suas turmas",
  "Atualizando o desempenho",
  "Quase lá…",
];

export default function LoadingTips() {
  const [index, setIndex] = useState(0);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let timeout;
    const interval = setInterval(() => {
      setHidden(true);
      timeout = setTimeout(() => {
        setIndex((i) => (i + 1) % MESSAGES.length);
        setHidden(false);
      }, 400);
    }, 2600);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div className={`${styles.tip} ${hidden ? styles.tipHidden : ""}`}>{MESSAGES[index]}</div>
  );
}
