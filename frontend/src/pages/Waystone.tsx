import ModTool from "../components/ModTool";
import { loadWaystone } from "../data";

export default function Waystone() {
  return (
    <ModTool load={loadWaystone} titleKey="waystone_title" introKey="waystone_intro" />
  );
}
