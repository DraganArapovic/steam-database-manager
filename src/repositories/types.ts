import type {
  AppUser,
  DatabaseBackend,
  EntityId,
  Game,
  LibraryEntry,
} from "../domain/models";
import type {
  CreateLibraryEntryForm,
  CreateUserForm,
  GameForm,
  UpdateLibraryEntryForm,
  UpdateUserForm,
} from "../forms";

export interface GameRepository {
  count(): Promise<number>;
  create(form: GameForm): Promise<EntityId>;
  delete(id: EntityId): Promise<void>;
  findById(id: EntityId): Promise<Game | null>;
  list(): Promise<Game[]>;
  update(id: EntityId, form: GameForm): Promise<void>;
}

export interface UserRepository {
  count(): Promise<number>;
  create(form: CreateUserForm): Promise<EntityId>;
  delete(id: EntityId): Promise<void>;
  findById(id: EntityId): Promise<AppUser | null>;
  list(): Promise<AppUser[]>;
  update(id: EntityId, form: UpdateUserForm): Promise<void>;
}

export interface LibraryRepository {
  count(): Promise<number>;
  create(form: CreateLibraryEntryForm): Promise<EntityId>;
  delete(id: EntityId): Promise<void>;
  findById(id: EntityId): Promise<LibraryEntry | null>;
  list(): Promise<LibraryEntry[]>;
  update(id: EntityId, form: UpdateLibraryEntryForm): Promise<void>;
}

export interface RepositoryBundle {
  backend: DatabaseBackend;
  games: GameRepository;
  library: LibraryRepository;
  users: UserRepository;
}

export interface RepositoryRegistry {
  mongo: RepositoryBundle;
  postgres: RepositoryBundle;
}
