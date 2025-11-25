import { QuestionSet } from "./types";
import { transformRaw } from "./helpers";
import { DATA_ANAYASA } from "./data/anayasa";
import { DATA_DENEME_3_SET } from "./data/deneme3";
import { DATA_IS_HUKUKU } from "./data/is_hukuku";
import { DATA_USUL } from "./data/usul";
import { DATA_VERGI } from "./data/vergi";

export const INITIAL_LIBRARY: QuestionSet[] = [
  {
    id: "anayasa-set",
    title: "Anayasa Hukuku",
    dateAdded: 1710000000000,
    questions: transformRaw(DATA_ANAYASA, "anayasa")
  },
  {
    id: "deneme-3-set",
    title: "Genel Deneme 3",
    dateAdded: 1710000000000,
    questions: transformRaw(DATA_DENEME_3_SET, "deneme3")
  },
  {
    id: "is-hukuku-set",
    title: "İş ve Sosyal Güvenlik Hukuku",
    dateAdded: 1710000000000,
    questions: transformRaw(DATA_IS_HUKUKU, "is_hukuku")
  },
  {
    id: "usul-hukuku-set",
    title: "Medeni Usul ve İcra İflas Hukuku",
    dateAdded: 1710000000000,
    questions: transformRaw(DATA_USUL, "usul")
  },
  {
    id: "vergi-usul-set",
    title: "Vergi Usul Hukuku",
    dateAdded: 1710000000000,
    questions: transformRaw(DATA_VERGI, "vergi")
  }
];