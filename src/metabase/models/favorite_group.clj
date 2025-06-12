(ns metabase.models.favorite-group
  (:require
   [metabase.util.malli :as mu]
   [metabase.util.malli.schema :as ms]
   [methodical.core :as methodical]
   [toucan2.core :as t2]))

(def FavoriteGroup "FavoriteGroup model" :model/FavoriteGroup)

(methodical/defmethod t2/table-name :model/FavoriteGroup [_model] :favorite_group)

(derive :model/FavoriteGroup :metabase/model)

(def FavoriteGroupBase
  "Базовая схема для группы избранного"
  [:map {:closed true}
   [:name :string]
   [:color :string]
   [:code :string]
   [:user_id :int]
   [:group_values :string]
   [:description {:optional true} [:maybe :string]]
   [:is_active {:optional true} [:maybe :boolean]]])

(mu/defn get-by-id
  "Получить группу по ID, только если она принадлежит указанному пользователю"
  [id       :- ms/PositiveInt
   user_id  :- ms/PositiveInt]
  (t2/select-one FavoriteGroup :id id :user_id user_id))

(mu/defn list-for-user
  "Получить все группы пользователя"
  [user-id :- ms/PositiveInt]
  (t2/select FavoriteGroup
             :user_id user-id
             {:order-by [[:created_at :desc]]}))

(mu/defn create!
  "Создать новую группу избранного"
  [group-data :- FavoriteGroupBase]
  (t2/insert! FavoriteGroup group-data))

(mu/defn update!
  "Обновить группу избранного"
  [id      :- ms/PositiveInt
   user_id :- ms/PositiveInt
   updates :- [:map
               [:name {:optional true} [:maybe :string]]
               [:color {:optional true} [:maybe :string]]
               [:code {:optional true} [:maybe :string]]
               [:description {:optional true} [:maybe :string]]
               [:group_values {:optional true} [:maybe :string]]
               [:is_active {:optional true} [:maybe :boolean]]]]
  (t2/update! FavoriteGroup
              {:id id :user_id user_id}
              updates))

(mu/defn delete!
  "Удалить группу избранного"
  [id       :- ms/PositiveInt
   user_id  :- ms/PositiveInt]
  (t2/delete! FavoriteGroup :id id :user_id user_id))
