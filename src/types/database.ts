// Re-export all domain types from their organized files.
// Import from the specific domain file for new code; this barrel exists for backward compatibility.

export type { User, Profile } from './user'

export type {
  ContactInfo,
  ProjectRole,
  ProjectMembership,
  InvitationLink,
  PushRequestStatus,
  NotePushRequest,
  Project,
  PublicLibrary,
  PublicLibraryWithTags,
  PublicLibraryTag,
} from './project'

export type { Tag, TagWithCount } from './tag'

export type {
  Song,
  SongTag,
  Artist,
  SongArtist,
  ArtistWithPosition,
  ArtistWithCount,
  SongWithTags,
  SongCode,
  SongV2,
  ArtistV2,
  SongArtistV2,
  LibrarySong,
  LibrarySongTag,
  SongV2WithArtists,
  LibrarySongWithSong,
  LibrarySongWithDetails,
} from './song'

export type {
  NoteType,
  LivenotesPatternRef,
  LivenotesPatternDef,
  LivenotesJson,
  SongcodeNoteData,
  LooperNoteData,
  LooperContent,
  Note,
  NoteWithSong,
} from './note'

export type { List, ListItem, ListWithSongs, ListWithItems } from './list'
