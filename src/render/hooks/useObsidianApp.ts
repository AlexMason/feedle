import { useContext } from "react";
import { ObsidianAppContext } from "../../main";

export default function useObsidianApp() {
	return useContext(ObsidianAppContext);
}
