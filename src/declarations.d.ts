declare module "*.css";

declare module "electron" {
    export const remote: any;
    export class BrowserWindow {
        [key: string]: any;
    }
}