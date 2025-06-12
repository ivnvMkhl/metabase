(ns metabase.api.favorite-group
  (:require [compojure.core :refer [GET POST PUT DELETE]]
            [metabase.api.common :as api]
            [metabase.models.favorite-group :as fav-group]))

(set! *warn-on-reflection* true)

(api/defendpoint GET "/"
  "Получить все группы избранного для текущего пользователя"
  []
  (let [current-user-id api/*current-user-id*]
    (fav-group/list-for-user current-user-id)))

(api/defendpoint GET "/:id"
  "Получить группу по ID."
  [^String id]
  (try
    (let [group-id (Long/parseLong id)]
      (if-let [group (let [current-user-id api/*current-user-id*]
                       (fav-group/get-by-id group-id current-user-id))]
        {:status 200 :body group}
        {:status 404 :body {:error "Группа не найдена или не принадлежит пользователю"}}))
    (catch NumberFormatException _
      {:status 400 :body {:error "ID должен быть числом"}})))

(api/defendpoint POST "/"
  "Создать новую группу избранного."
  [:as {{:keys [name description group_values is_active color code]} :body}]
  {:required [:name :color :code :group_values :user_id]}
  (let [current-user-id api/*current-user-id*]
    (fav-group/create!
     {:name         name
      :color        color
      :code         code
      :description  description
      :group_values group_values
      :is_active    (or is_active true)
      :user_id      current-user-id})))

(api/defendpoint PUT "/:id"
  "Обновить группу избранного"
  [id :as {body :body}]  ;; Proper parameter binding for defendpoint
  (try
    (let [group-id (Long/parseLong id)
          current-user-id (or api/*current-user-id*
                              (throw (ex-info "User not authenticated" {:status 401})))
          {:keys [name description group_values is_active color code]} body  ;; Destructure body here
          updates (-> {}
                      (cond-> name (assoc :name name))
                      (cond-> color (assoc :color color))
                      (cond-> code (assoc :code code))
                      (cond-> description (assoc :description description))
                      (cond-> group_values (assoc :group_values group_values))
                      (cond-> (some? is_active) (assoc :is_active is_active)))]
      (if (pos? (fav-group/update! group-id current-user-id updates))
        {:status 200 :body (fav-group/get-by-id group-id current-user-id)}
        {:status 404 :body {:error "Группа не найдена или не принадлежит пользователю"}}))
    (catch NumberFormatException _
      {:status 400 :body {:error "ID должен быть числом"}})
    (catch Exception e
      (if (= 401 (:status (ex-data e)))
        {:status 401 :body {:error "Пользователь не аутентифицирован"}}
        (throw e)))))

(api/defendpoint DELETE "/:id"
  "Удалить группу избранного, только если она принадлежит текущему пользователю."
  [^String id]
  (try
    (let [group-id (Long/parseLong id)]
      (if (pos? (let [current-user-id api/*current-user-id*] (fav-group/delete! group-id current-user-id)))
        api/generic-204-no-content
        {:status 404
         :body {:error "Группа не найдена или не принадлежит пользователю"}}))
    (catch NumberFormatException _
      {:status 400 :body {:error "ID должен быть числом"}})))

(api/define-routes)
