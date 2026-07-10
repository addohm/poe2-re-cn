import ModTool from "../components/ModTool";
import { loadRelic } from "../data";

export default function Relic() {
  return <ModTool load={loadRelic} titleKey="relic_title" introKey="relic_intro" />;
}
