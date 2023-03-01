import { MetaBug } from "../GlobalContext/GlobalContextTypes";

export interface GetQueryOptions {
  metas: MetaBug[];
  components: Array<string>;
}

export interface OtherViewProps {
  match: { url: string };
  components: Array<string>;
}
