import { useState, type FC } from "react";

import { useGetFavoriteListQuery } from "metabase/api/favorite";
import LoadingAndErrorWrapper from "metabase/components/LoadingAndErrorWrapper";
import { color } from "metabase/lib/colors";
import { Button, Flex, Group, Icon, Modal, Title } from "metabase/ui";
import type { FavoriteGroup } from "metabase-types/api/favorite";

import {
  BrowseContainer,
  BrowseHeader,
  BrowseMain,
  BrowseSection,
  BrowseGrid,
} from "../BrowseContainer.styled";

import {
  ColorMarker,
  FavoriteCard,
  FavoriteWithLabel,
} from "./FavoriteList.styled";
import { EditFavoriteGroup } from "./components/EditFavoriteGroup/EditFavoriteGroup";

export const FavoriteList: FC = () => {
  const {
    data: favoriteGroups,
    isFetching,
    error,
    refetch,
  } = useGetFavoriteListQuery();
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingGroup, setEditingGroup] = useState<FavoriteGroup>();

  const handleCloseModal = () => {
    setIsEditModalVisible(false);
    setEditingGroup(undefined);
  };

  const handleOpenModal = () => {
    setIsEditModalVisible(true);
  };

  const handleEditComplete = () => {
    refetch();
    handleCloseModal();
  };

  const handleEdit = (editingGroup: FavoriteGroup) => () => {
    setEditingGroup(editingGroup);
    setIsEditModalVisible(true);
  };

  if (error) {
    return <BrowseContainer>Ошибка загрузки списка избранного</BrowseContainer>;
  }

  if (!favoriteGroups && isFetching) {
    return <LoadingAndErrorWrapper loading />;
  }

  return (
    <>
      <BrowseContainer>
        <BrowseHeader>
          <BrowseSection>
            <Flex
              w="100%"
              h="2.25rem"
              direction="row"
              justify="space-between"
              align="center"
            >
              <Title order={1} color="text-dark">
                <Group spacing="sm">
                  <Icon size={24} color={color("brand")} name="star" />
                  {`Избранное`}
                </Group>
              </Title>
              <Button onClick={handleOpenModal}>Создать</Button>
            </Flex>
          </BrowseSection>
        </BrowseHeader>
        <BrowseMain>
          <BrowseSection>
            <BrowseGrid data-testid="favorite-browser">
              {favoriteGroups?.map(group => (
                <FavoriteCard key={group.id} onClick={handleEdit(group)}>
                  <Icon name="star" color={color("accent2")} size={32} />
                  <FavoriteWithLabel>
                    <ColorMarker color={group.color} />
                    <Title order={2} size="1rem" lh="1rem" color="inherit">
                      {group.name}
                    </Title>
                  </FavoriteWithLabel>
                </FavoriteCard>
              ))}
            </BrowseGrid>
          </BrowseSection>
        </BrowseMain>
      </BrowseContainer>
      <Modal
        title="Создаание группы избранного"
        opened={isEditModalVisible}
        onClose={handleCloseModal}
      >
        <EditFavoriteGroup
          favoriteGroup={editingGroup}
          onCancel={handleCloseModal}
          onComplete={handleEditComplete}
        />
      </Modal>
    </>
  );
};
