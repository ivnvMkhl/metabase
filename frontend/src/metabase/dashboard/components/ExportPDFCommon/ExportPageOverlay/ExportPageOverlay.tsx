import type { FC } from "react";

import { BottomText } from "./BottomText";
import styles from "./ExportPageOverlay.module.css";
import { TopLogo } from "./TopLogo";

const ExportPageOverlay: FC = () => {
  return (
    <>
      <div className={styles.topLine}></div>
      <div className={styles.topLogo}>
        <TopLogo />
      </div>
      <div className={styles.bottomLine}></div>
      <div className={styles.bottomText}>
        <BottomText />
      </div>
    </>
  );
};

export { ExportPageOverlay };
