export interface MvcConfig {
  /**
   * Default layout. This is the layout that is used when no layout is specified.
   * The default value is 'main'. To disable a default layout, pass in false
   */
  defaultLayout: string | false;
  /**
   * Folder where the views will be located. By default this is src/views
   */
  viewFolder: string;
  /**
   * Folder where the layouts are located. By default this is src/views/_layout
   */
  layoutFolder: string;
  /**
   * Folder where the partial views are located. By default this is src/views/_partials
   */
  partialsFolder: string;
  /**
   * Indicates whether the cache templates. When set to true the templates will be read from disk and pre-compiled once.
   */
  cacheTemplates: boolean;
  /**
   * Error view. This view will be rendered when an unhandled error occurs.
   */
  errorView?: string;
}
