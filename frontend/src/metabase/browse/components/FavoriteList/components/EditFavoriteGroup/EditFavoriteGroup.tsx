// eslint-disable-next-line no-restricted-imports
import { ColorInput } from "@mantine/core";
import { useState, type FC, type ReactNode } from "react";
import { t } from "ttag";
import * as Yup from "yup";

import {
  useCreateFavoriteMutation,
  useDeleteFavoriteMutation,
  useUpdateFavoriteMutation,
} from "metabase/api/favorite";
import Button from "metabase/core/components/Button";
import FormFooter from "metabase/core/components/FormFooter";
import FormSubmitButton from "metabase/core/components/FormSubmitButton";
import {
  Form,
  FormErrorMessage,
  FormProvider,
  FormTextInput,
} from "metabase/forms";
import type { FavoriteGroup } from "metabase-types/api/favorite";

import { FavoriteValues } from "../FavoriteValues/FavoriteValues";
import { Spoiler } from "../Spoiler/Spoiler";

import { FormControlsWrapper } from "./EditFavoriteGroup.styled";

const FAVORITE_GROUP_MAPPING_SCHEMA = Yup.object({
  name: Yup.string().required("Имя должно быть не пустым"),
  description: Yup.string(),
  color: Yup.string().required("Цвет должен быть указан"),
  code: Yup.string().required("Укажите код колонки для сбора значений"),
});

type FormValuesType = Pick<
  FavoriteGroup,
  "name" | "code" | "description" | "group_values" | "color" | "is_active"
>;

type Props = {
  favoriteGroup?: FormValuesType & { id: number };
  onCancel?: () => void;
  onComplete?: () => void;
};

const initialValues: FormValuesType = {
  group_values: `[]`,
  name: "",
  code: "ЖК рус",
  color: "#e20613",
  is_active: true,
};

export const EditFavoriteGroup: FC<Props> = ({
  onCancel,
  favoriteGroup,
  onComplete,
}) => {
  const [isSpoilerOpen, setIsSpoilerOpen] = useState(false);
  const [createFavorite, { isLoading: isCreating }] =
    useCreateFavoriteMutation();

  const [updateFavorite, { isLoading: isUpdating }] =
    useUpdateFavoriteMutation();

  const [deleteFavorite] = useDeleteFavoriteMutation();

  const handleSubmit = async (values: FormValuesType) => {
    if (favoriteGroup) {
      await updateFavorite({ ...values, id: favoriteGroup.id });
    } else {
      await createFavorite(values);
    }
    onComplete?.();
  };

  const handleDelete = async () => {
    favoriteGroup && (await deleteFavorite({ id: favoriteGroup.id }));
    onComplete?.();
  };

  return (
    <FormProvider<FormValuesType>
      initialValues={favoriteGroup || initialValues}
      validationSchema={FAVORITE_GROUP_MAPPING_SCHEMA}
      enableReinitialize
      onSubmit={handleSubmit}
    >
      {({ values, setFieldValue }) => (
        <Form>
          <FormControlsWrapper>
            <FormTextInput
              name="name"
              label={"Имя группы"}
              placeholder={"Введите имя"}
              required
            />
            <FormTextInput
              name="description"
              label={"Описание"}
              placeholder={"Введите описание"}
            />
            <ColorInput
              label="Цвет"
              required
              placeholder={"Выберите цвет"}
              value={values.color}
              onChange={(color: string) => setFieldValue("color", color)}
            />
            <Spoiler
              label="Показать экспертные настройки"
              isOpen={isSpoilerOpen}
              onVisibleChange={setIsSpoilerOpen}
            >
              <FormTextInput
                name="code"
                label={"Код колонки для сбора значений"}
                placeholder={"Введите код"}
                required
              />
            </Spoiler>
            <FavoriteValues
              favoriteValues={values.group_values}
              onValuesChange={updatedValues => {
                setFieldValue("group_values", updatedValues);
              }}
            />
          </FormControlsWrapper>
          <FormFooter hasTopBorder>
            <FormErrorMessage inline />
            {Boolean(favoriteGroup) && (
              <Button
                type="button"
                primary
                onClick={handleDelete}
              >{t`Delete`}</Button>
            )}
            <Button type="button" onClick={onCancel}>{t`Cancel`}</Button>
            <FormSubmitButton
              title={favoriteGroup ? t`Save` : t`Create`}
              primary
              disabled={isCreating || isUpdating}
            />
          </FormFooter>
        </Form>
      )}
    </FormProvider>
  );
};
