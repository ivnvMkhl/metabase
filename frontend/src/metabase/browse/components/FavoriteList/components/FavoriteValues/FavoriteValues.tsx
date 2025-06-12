import type { FC, MouseEvent } from "react";

import { ColumnItemIcon, Tag, TagContainer } from "./FavoriteValues.styled";

type Props = {
  favoriteValues: string;
  onValuesChange: (updatedValues: string) => void;
};

interface ActionIconProps {
  icon: string;
  onClick: (target: MouseEvent) => void;
  "data-testid"?: string;
}

const ActionIcon = ({ icon, onClick }: ActionIconProps) => (
  <ColumnItemIcon
    icon={icon}
    onlyIcon
    type="button"
    iconSize={16}
    onClick={e => {
      e.stopPropagation();
      onClick(e);
    }}
  />
);
export const FavoriteValues: FC<Props> = ({
  favoriteValues,
  onValuesChange,
}) => {
  const parsedValues: string[] | null = JSON.parse(favoriteValues);

  if (!parsedValues || !Array.isArray(parsedValues) || !parsedValues.length) {
    return null;
  }

  const setFromValues = new Set(parsedValues);

  const handleDeleteValue = (value: string) => {
    setFromValues.delete(value);
    onValuesChange(JSON.stringify(Array.from(setFromValues)));
  };

  return (
    <TagContainer>
      {Array.from(setFromValues).map(value => (
        <Tag key={value}>
          {value}
          <ActionIcon
            icon="close"
            onClick={e => {
              e.stopPropagation();
              handleDeleteValue(value);
            }}
          />
        </Tag>
      ))}
    </TagContainer>
  );
};
