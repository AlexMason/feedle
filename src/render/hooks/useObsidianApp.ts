import { useContext } from "react";
import { ObsidianAppContext } from "../../main.js";

export default function useObsidianApp() {
	return useContext(ObsidianAppContext);
}
