class FavoriteFilters {
  private readonly key = "favoriteFilters";
  constructor() {
    if (!this.readStorage()) {
      localStorage.setItem(this.key, JSON.stringify({}));
    }
  }

  private readStorage = (): Record<string, string> => {
    return JSON.parse(localStorage.getItem(this.key) ?? "null");
  };

  private writeStorage = (value: Record<string, string>) => {
    localStorage.setItem(this.key, JSON.stringify(value));
  };

  set = (filterKey: string, favoriteGroupId: string) => {
    const prevValues = this.readStorage();
    this.writeStorage({ ...prevValues, [filterKey]: favoriteGroupId });
  };

  get = (filterKey: string): string | undefined => {
    return this.readStorage()?.[filterKey];
  };

  has = (filterKey: string): boolean => {
    return Boolean(this.readStorage()?.[filterKey]);
  };

  delete = (filterKey: string) => {
    const values = this.readStorage();
    delete values[filterKey];
    this.writeStorage(values);
  };
}

export const favoriteFilters = new FavoriteFilters();
