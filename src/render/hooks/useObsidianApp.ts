import { useContext } from "react";
import { ObsidianAppContext } from "src/main";

export default function useObsidianApp() {
	return useContext(ObsidianAppContext);
}
