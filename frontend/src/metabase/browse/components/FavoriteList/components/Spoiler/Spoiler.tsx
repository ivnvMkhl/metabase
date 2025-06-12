import styled from "@emotion/styled";
import type { FC } from "react";
import type { ReactNode } from "react-markdown/lib/react-markdown";

export const SpoilerLink = styled.a`
  &:hover {
    color: var(--mb-color-brand);
  }
`;

export const Spoiler: FC<{
  label: string;
  isOpen: boolean;
  onVisibleChange: (visible: boolean) => void;
  children: ReactNode;
}> = ({ label, isOpen, children, onVisibleChange }) => {
  return (
    <>
      {isOpen ? (
        children
      ) : (
        <SpoilerLink onClick={() => onVisibleChange(!isOpen)}>
          {label}
        </SpoilerLink>
      )}
    </>
  );
};
