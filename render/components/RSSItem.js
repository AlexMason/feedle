import { __awaiter } from "tslib";
import * as React from "react";
import StarIcon from "./icons/StarIcon";
import DownloadIcon from "./icons/DownloadIcon";
import { addFavorite, addRead, addSaved, removeFavorite, removeSaved, } from "../../util/feedle-note-utils";
import useObsidianApp from "../hooks/useObsidianApp";
import { WebviewModal } from "../../ui/WebviewModal";
const feedDateFormat = new Intl.DateTimeFormat("en-US", {
    dateStyle: "short",
    // timeStyle: "long",
    // timeZone: "",
});
export default function RSSListItem(props) {
    let app = useObsidianApp();
    return (React.createElement("li", { className: "flex gap-1 items-center" },
        React.createElement("button", { title: "Favorite Article", className: "w-8", onClick: () => handleFavoriteButton(props.item) },
            React.createElement(StarIcon, { fillColor: props.isFavorite ? "currentColor" : "unset" })),
        " ",
        React.createElement("button", { title: "Save Article in Obsidian", className: "w-8", onClick: () => handleSaveButton(props.item) },
            React.createElement(DownloadIcon, { fillColor: props.isSaved ? "currentColor" : "unset" })),
        " ",
        React.createElement("a", { href: props.item.link, title: props.item.title, className: `truncate flex-1${props.isRead ? " opacity-50 line-through" : ""}`, onClick: (e) => { e.preventDefault(); handleReadClick(props.item); } }, props.item.title),
        React.createElement("span", { className: "whitespace-nowrap" }, feedDateFormat.format(new Date(props.item.published || "")).toString())));
    function handleSaveButton(item) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!!props.isSaved) {
                // TODO: Handle removing saved note?
                yield handleRemoveSaved(item);
            }
            else {
                // TODO: Handle adding saved note
                // node-unfluff
                yield handleAddSaved(item);
            }
            props.onSaveChange && props.onSaveChange(item);
        });
    }
    function handleAddSaved(item) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (app && ((_a = app.workspace.activeEditor) === null || _a === void 0 ? void 0 : _a.editor)) {
                yield addSaved(app, app.workspace.activeEditor.editor, item);
            }
        });
    }
    function handleRemoveSaved(item) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (app && ((_a = app.workspace.activeEditor) === null || _a === void 0 ? void 0 : _a.editor)) {
                yield removeSaved(app.workspace.activeEditor.editor, item);
            }
        });
    }
    function handleFavoriteButton(item) {
        if (props.isFavorite) {
            handleRemoveFavorite(item);
        }
        else {
            handleAddFavorite(item);
        }
        props.onFavoriteChange && props.onFavoriteChange(item);
    }
    function handleReadClick(item) {
        var _a;
        if (item.link) {
            new WebviewModal(app, item.link).open();
        }
        if (!props.isRead) {
            if (app && ((_a = app.workspace.activeEditor) === null || _a === void 0 ? void 0 : _a.editor)) {
                addRead(app.workspace.activeEditor.editor, item);
            }
            props.onReadChange && props.onReadChange(item);
        }
    }
    function handleAddFavorite(item) {
        var _a;
        if (app && ((_a = app.workspace.activeEditor) === null || _a === void 0 ? void 0 : _a.editor)) {
            addFavorite(app.workspace.activeEditor.editor, item);
        }
    }
    function handleRemoveFavorite(item) {
        var _a;
        if (app && ((_a = app.workspace.activeEditor) === null || _a === void 0 ? void 0 : _a.editor)) {
            removeFavorite(app.workspace.activeEditor.editor, item);
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUlNTSXRlbS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9yZW5kZXIvY29tcG9uZW50cy9SU1NJdGVtLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxLQUFLLEtBQUssTUFBTSxPQUFPLENBQUM7QUFFL0IsT0FBTyxRQUFRLE1BQU0sa0JBQWtCLENBQUM7QUFDeEMsT0FBTyxZQUFZLE1BQU0sc0JBQXNCLENBQUM7QUFFaEQsT0FBTyxFQUNOLFdBQVcsRUFDWCxPQUFPLEVBQ1AsUUFBUSxFQUNSLGNBQWMsRUFDZCxXQUFXLEdBQ1gsTUFBTSw4QkFBOEIsQ0FBQztBQUV0QyxPQUFPLGNBQWMsTUFBTSx5QkFBeUIsQ0FBQztBQUdyRCxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0sdUJBQXVCLENBQUM7QUFFckQsTUFBTSxjQUFjLEdBQUcsSUFBSSxJQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRTtJQUN2RCxTQUFTLEVBQUUsT0FBTztJQUNsQixxQkFBcUI7SUFDckIsZ0JBQWdCO0NBQ2hCLENBQUMsQ0FBQztBQWNILE1BQU0sQ0FBQyxPQUFPLFVBQVUsV0FBVyxDQUFDLEtBQW1CO0lBQ3RELElBQUksR0FBRyxHQUFHLGNBQWMsRUFBUyxDQUFDO0lBRWxDLE9BQU8sQ0FDTiw0QkFBSSxTQUFTLEVBQUMseUJBQXlCO1FBQ3RDLGdDQUFRLEtBQUssRUFBQyxrQkFBa0IsRUFBQyxTQUFTLEVBQUMsS0FBSyxFQUFDLE9BQU8sRUFBRSxHQUFHLEVBQUUsQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDO1lBQy9GLG9CQUFDLFFBQVEsSUFBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUksQ0FDNUQ7UUFBQyxHQUFHO1FBQ2IsZ0NBQVEsS0FBSyxFQUFDLDBCQUEwQixFQUFDLFNBQVMsRUFBQyxLQUFLLEVBQUMsT0FBTyxF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R0FBRyxDQUFDLFNBQVMsQ0FBQyxZQUFZLDBDQUFFLE1BQU0sQ0FBQSxFQUFFLENBQUM7Z0JBQy9DLE9BQU8sQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDbEQsQ0FBQztZQUNELEtBQUssQ0FBQyxZQUFZLElBQUksS0FBSyxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNoRCxDQUFDO0lBQ0YsQ0FBQztJQUVELFNBQVMsaUJBQWlCLENBQUMsSUFBYTs7UUFDdkMsSUFBSSxHQUFHLEtBQUksTUFBQSxHQUFHLENBQUMsU0FBUyxDQUFDLFlBQVksMENBQUUsTUFBTSxDQUFBLEVBQUUsQ0FBQztZQUMvQyxXQUFXLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ3RELENBQUM7SUFDRixDQUFDO0lBRUQsU0FBUyxvQkFBb0IsQ0FBQyxJQUFhOztRQUMxQyxJQUFJLEdBQUcsS0FBSSxNQUFBLEdBQUcsQ0FBQyxTQUFTLENBQUMsWUFBWSwwQ0FBRSxNQUFNLENBQUEsRUFBRSxDQUFDO1lBQy9DLGNBQWMsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDekQsQ0FBQztJQUNGLENBQUM7QUFDRixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgUmVhY3QgZnJvbSBcInJlYWN0XCI7XG5cbmltcG9ydCBTdGFySWNvbiBmcm9tIFwiLi9pY29ucy9TdGFySWNvblwiO1xuaW1wb3J0IERvd25sb2FkSWNvbiBmcm9tIFwiLi9pY29ucy9Eb3dubG9hZEljb25cIjtcblxuaW1wb3J0IHtcblx0YWRkRmF2b3JpdGUsXG5cdGFkZFJlYWQsXG5cdGFkZFNhdmVkLFxuXHRyZW1vdmVGYXZvcml0ZSxcblx0cmVtb3ZlU2F2ZWQsXG59IGZyb20gXCIuLi8uLi91dGlsL2ZlZWRsZS1ub3RlLXV0aWxzXCI7XG5cbmltcG9ydCB1c2VPYnNpZGlhbkFwcCBmcm9tIFwiLi4vaG9va3MvdXNlT2JzaWRpYW5BcHBcIjtcbmltcG9ydCB7IEFwcCB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgRmVlZEVudHJ5IH0gZnJvbSBcIkBleHRyYWN0dXMvZmVlZC1leHRyYWN0b3JcIjtcbmltcG9ydCB7IFdlYnZpZXdNb2RhbCB9IGZyb20gXCIuLi8uLi91aS9XZWJ2aWV3TW9kYWxcIjtcblxuY29uc3QgZmVlZERhdGVGb3JtYXQgPSBuZXcgSW50bC5EYXRlVGltZUZvcm1hdChcImVuLVVTXCIsIHtcblx0ZGF0ZVN0eWxlOiBcInNob3J0XCIsXG5cdC8vIHRpbWVTdHlsZTogXCJsb25nXCIsXG5cdC8vIHRpbWVab25lOiBcIlwiLFxufSk7XG5cbmV4cG9ydCB0eXBlIFJTU0l0ZW0gPSBGZWVkRW50cnk7XG5cbnR5cGUgUlNTSXRlbVByb3BzID0ge1xuXHRpdGVtOiBGZWVkRW50cnk7XG5cdGlzRmF2b3JpdGU6IGJvb2xlYW47XG5cdGlzU2F2ZWQ6IGJvb2xlYW47XG5cdGlzUmVhZDogYm9vbGVhbjtcblx0b25GYXZvcml0ZUNoYW5nZT86IChpdGVtOiBSU1NJdGVtKSA9PiB2b2lkO1xuXHRvblNhdmVDaGFuZ2U/OiAoaXRlbTogUlNTSXRlbSkgPT4gdm9pZDtcblx0b25SZWFkQ2hhbmdlPzogKGl0ZW06IFJTU0l0ZW0pID0+IHZvaWQ7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBSU1NMaXN0SXRlbShwcm9wczogUlNTSXRlbVByb3BzKSB7XG5cdGxldCBhcHAgPSB1c2VPYnNpZGlhbkFwcCgpIGFzIEFwcDtcblxuXHRyZXR1cm4gKFxuXHRcdDxsaSBjbGFzc05hbWU9XCJmbGV4IGdhcC0xIGl0ZW1zLWNlbnRlclwiPlxuXHRcdFx0PGJ1dHRvbiB0aXRsZT1cIkZhdm9yaXRlIEFydGljbGVcIiBjbGFzc05hbWU9XCJ3LThcIiBvbkNsaWNrPXsoKSA9PiBoYW5kbGVGYXZvcml0ZUJ1dHRvbihwcm9wcy5pdGVtKX0+XG5cdFx0XHRcdDxTdGFySWNvbiBmaWxsQ29sb3I9e3Byb3BzLmlzRmF2b3JpdGUgPyBcImN1cnJlbnRDb2xvclwiIDogXCJ1bnNldFwifSAvPlxuXHRcdFx0PC9idXR0b24+e1wiIFwifVxuXHRcdFx0PGJ1dHRvbiB0aXRsZT1cIlNhdmUgQXJ0aWNsZSBpbiBPYnNpZGlhblwiIGNsYXNzTmFtZT1cInctOFwiIG9uQ2xpY2s9eygpID0+IGhhbmRsZVNhdmVCdXR0b24ocHJvcHMuaXRlbSl9PlxuXHRcdFx0XHQ8RG93bmxvYWRJY29uIGZpbGxDb2xvcj17cHJvcHMuaXNTYXZlZCA/IFwiY3VycmVudENvbG9yXCIgOiBcInVuc2V0XCJ9IC8+XG5cdFx0XHQ8L2J1dHRvbj57XCIgXCJ9XG5cdFx0XHQ8YVxuXHRcdFx0XHRocmVmPXtwcm9wcy5pdGVtLmxpbmt9XG5cdFx0XHRcdHRpdGxlPXtwcm9wcy5pdGVtLnRpdGxlfVxuXHRcdFx0XHRjbGFzc05hbWU9e2B0cnVuY2F0ZSBmbGV4LTEke3Byb3BzLmlzUmVhZCA/IFwiIG9wYWNpdHktNTAgbGluZS10aHJvdWdoXCIgOiBcIlwifWB9XG5cdFx0XHRcdG9uQ2xpY2s9eyhlKSA9PiB7IGUucHJldmVudERlZmF1bHQoKTsgaGFuZGxlUmVhZENsaWNrKHByb3BzLml0ZW0pOyB9fVxuXHRcdFx0PlxuXHRcdFx0XHR7cHJvcHMuaXRlbS50aXRsZX1cblx0XHRcdDwvYT5cblx0XHRcdDxzcGFuIGNsYXNzTmFtZT1cIndoaXRlc3BhY2Utbm93cmFwXCI+XG5cdFx0XHRcdHtmZWVkRGF0ZUZvcm1hdC5mb3JtYXQobmV3IERhdGUocHJvcHMuaXRlbS5wdWJsaXNoZWQgfHwgXCJcIikpLnRvU3RyaW5nKCl9XG5cdFx0XHQ8L3NwYW4+XG5cdFx0PC9saT5cblx0KTtcblxuXHRhc3luYyBmdW5jdGlvbiBoYW5kbGVTYXZlQnV0dG9uKGl0ZW06IFJTU0l0ZW0pIHtcblx0XHRpZiAoISFwcm9wcy5pc1NhdmVkKSB7XG5cdFx0XHQvLyBUT0RPOiBIYW5kbGUgcmVtb3Zpbmcgc2F2ZWQgbm90ZT9cblx0XHRcdGF3YWl0IGhhbmRsZVJlbW92ZVNhdmVkKGl0ZW0pO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyBUT0RPOiBIYW5kbGUgYWRkaW5nIHNhdmVkIG5vdGVcblx0XHRcdC8vIG5vZGUtdW5mbHVmZlxuXHRcdFx0YXdhaXQgaGFuZGxlQWRkU2F2ZWQoaXRlbSk7XG5cdFx0fVxuXG5cdFx0cHJvcHMub25TYXZlQ2hhbmdlICYmIHByb3BzLm9uU2F2ZUNoYW5nZShpdGVtKTtcblx0fVxuXG5cdGFzeW5jIGZ1bmN0aW9uIGhhbmRsZUFkZFNhdmVkKGl0ZW06IFJTU0l0ZW0pIHtcblx0XHRpZiAoYXBwICYmIGFwcC53b3Jrc3BhY2UuYWN0aXZlRWRpdG9yPy5lZGl0b3IpIHtcblx0XHRcdGF3YWl0IGFkZFNhdmVkKGFwcCwgYXBwLndvcmtzcGFjZS5hY3RpdmVFZGl0b3IuZWRpdG9yLCBpdGVtKTtcblx0XHR9XG5cdH1cblxuXHRhc3luYyBmdW5jdGlvbiBoYW5kbGVSZW1vdmVTYXZlZChpdGVtOiBSU1NJdGVtKSB7XG5cdFx0aWYgKGFwcCAmJiBhcHAud29ya3NwYWNlLmFjdGl2ZUVkaXRvcj8uZWRpdG9yKSB7XG5cdFx0XHRhd2FpdCByZW1vdmVTYXZlZChhcHAud29ya3NwYWNlLmFjdGl2ZUVkaXRvci5lZGl0b3IsIGl0ZW0pO1xuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIGhhbmRsZUZhdm9yaXRlQnV0dG9uKGl0ZW06IFJTU0l0ZW0pIHtcblx0XHRpZiAocHJvcHMuaXNGYXZvcml0ZSkge1xuXHRcdFx0aGFuZGxlUmVtb3ZlRmF2b3JpdGUoaXRlbSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGhhbmRsZUFkZEZhdm9yaXRlKGl0ZW0pO1xuXHRcdH1cblxuXHRcdHByb3BzLm9uRmF2b3JpdGVDaGFuZ2UgJiYgcHJvcHMub25GYXZvcml0ZUNoYW5nZShpdGVtKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGhhbmRsZVJlYWRDbGljayhpdGVtOiBSU1NJdGVtKSB7XG5cdFx0aWYgKGl0ZW0ubGluaykge1xuXHRcdFx0bmV3IFdlYnZpZXdNb2RhbChhcHAsIGl0ZW0ubGluaykub3BlbigpO1xuXHRcdH1cblx0XHRpZiAoIXByb3BzLmlzUmVhZCkge1xuXHRcdFx0aWYgKGFwcCAmJiBhcHAud29ya3NwYWNlLmFjdGl2ZUVkaXRvcj8uZWRpdG9yKSB7XG5cdFx0XHRcdGFkZFJlYWQoYXBwLndvcmtzcGFjZS5hY3RpdmVFZGl0b3IuZWRpdG9yLCBpdGVtKTtcblx0XHRcdH1cblx0XHRcdHByb3BzLm9uUmVhZENoYW5nZSAmJiBwcm9wcy5vblJlYWRDaGFuZ2UoaXRlbSk7XG5cdFx0fVxuXHR9XG5cblx0ZnVuY3Rpb24gaGFuZGxlQWRkRmF2b3JpdGUoaXRlbTogUlNTSXRlbSkge1xuXHRcdGlmIChhcHAgJiYgYXBwLndvcmtzcGFjZS5hY3RpdmVFZGl0b3I/LmVkaXRvcikge1xuXHRcdFx0YWRkRmF2b3JpdGUoYXBwLndvcmtzcGFjZS5hY3RpdmVFZGl0b3IuZWRpdG9yLCBpdGVtKTtcblx0XHR9XG5cdH1cblxuXHRmdW5jdGlvbiBoYW5kbGVSZW1vdmVGYXZvcml0ZShpdGVtOiBSU1NJdGVtKSB7XG5cdFx0aWYgKGFwcCAmJiBhcHAud29ya3NwYWNlLmFjdGl2ZUVkaXRvcj8uZWRpdG9yKSB7XG5cdFx0XHRyZW1vdmVGYXZvcml0ZShhcHAud29ya3NwYWNlLmFjdGl2ZUVkaXRvci5lZGl0b3IsIGl0ZW0pO1xuXHRcdH1cblx0fVxufVxuIl19