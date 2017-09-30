
const FUNC =
`/**
 * nk_window_get_size() descriptive comment
 */
NK_API struct nk_rect
nk_window_get_size(const struct nk_context *ctx)
{
  // internal function comment
  int i = 0;
}
`
const STRUCT =
`/**
 * nk_rect descriptive comment
 */
NK_API struct nk_rect
{
    // internal struct comment
    // which gets attached to the internal member.
    float x,y,w,h;
}
`
const STRUCT_FUNCS =
`

/**
 * nk_rect descriptive comment
 */
NK_API struct nk_rect
{
    // internal struct comment
    // which gets attached to the internal member.
    float x,y,w,h;
}

/**
 * nk_window_get_size() descriptive comment
 */
NK_API struct nk_rect
nk_window_get_size(const struct nk_context *ctx)
{
  // internal function comment
  int i = 0;
}


`

const STRUCT_DECLS = `
struct nk_buffer;
struct nk_allocator;
struct nk_command_buffer;
struct nk_draw_command;
struct nk_convert_config;
struct nk_style_item;
struct nk_text_edit;
struct nk_draw_list;
struct nk_user_font;
struct nk_panel;
struct nk_context;
struct nk_draw_vertex_layout_element;
// Multi
// Line
// Comment
struct nk_style_button;
struct nk_style_toggle;
struct nk_style_selectable;
struct nk_style_slide;
// Single line comment
struct nk_style_progress;
struct nk_style_scrollbar;
struct nk_style_edit;
/**
* This struct actually has a comment
*/
struct nk_style_property;
struct nk_style_chart;
struct nk_style_combo;
struct nk_style_tab;
struct nk_style_window_header;
struct nk_style_window;
`;

const SAMPLES = {
  STRUCT_FUNCS,
  STRUCT_DECLS,
  STRUCT,
  FUNC
};

export default SAMPLES;
