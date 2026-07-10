import ModTool from "../components/ModTool";
import { loadTablet } from "../data";

export default function Tablet() {
  return (
    <ModTool load={loadTablet} titleKey="tablet_title" introKey="tablet_intro" />
  );
}
