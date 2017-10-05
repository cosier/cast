
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

const COMM_SPACES =
`
// A disconnected comment due to spacing

// This comment is associateed with nk_style_chart
struct nk_style_chart;

// Additional independent comment.

struct nk_style_combo;
struct nk_style_tab;

`

const STRUCT_DOC = `

/*  nk_init_default - Initializes a \`nk_context\` struct with a default standard library allocator.
 *  Should be used if you don't want to be bothered with memory management in nuklear.
 *  Parameters:
 *      @ctx must point to an either stack or heap allocated \`nk_context\` struct
 *      @font must point to a previously initialized font handle for more info look at font documentation
 *  Return values:
 *      true(1) on success
 *      false(0) on failure */
NK_API int nk_init_default(struct nk_context*, const struct nk_user_font*);
`;

const ENUMS = `

/* =============================================================================
 *
 *                                  INPUT
 *
 * =============================================================================*/
/*  The input API is responsible for holding the current input state composed of
 *  mouse, key and text input states.
 *  It is worth noting that no direct os or window handling is done in nuklear.
 *  Instead all input state has to be provided by platform specific code. This in one hand
 *  expects more work from the user and complicates usage but on the other hand
 *  provides simple abstraction over a big number of platforms, libraries and other
 *  already provided functionality.
 *
 *  Usage
 *  -------------------
 *  Input state needs to be provided to nuklear by first calling \`nk_input_begin\`
 *  which resets internal state like delta mouse position and button transistions.
 *  After \`nk_input_begin\` all current input state needs to be provided. This includes
 *  mouse motion, button and key pressed and released, text input and scrolling.
 *  Both event- or state-based input handling are supported by this API
 *  and should work without problems. Finally after all input state has been
 *  mirrored \`nk_input_end\` needs to be called to finish input process.
 *
 *      struct nk_context ctx;
 *      nk_init_xxx(&ctx, ...);
 *      while (1) {
 *          Event evt;
 *          nk_input_begin(&ctx);
 *          while (GetEvent(&evt)) {
 *              if (evt.type == MOUSE_MOVE)
 *                  nk_input_motion(&ctx, evt.motion.x, evt.motion.y);
 *              else if (evt.type == ...) {
 *                  ...
 *              }
 *          }
 *          nk_input_end(&ctx);
 *          [...]
 *          nk_clear(&ctx);
 *      }
 *      nk_free(&ctx);
 *
 *  Reference
 *  -------------------
 *  nk_input_begin      - Begins the input mirroring process. Needs to be called before all other \`nk_input_xxx\` calls
 *  nk_input_motion     - Mirrors mouse cursor position
 *  nk_input_key        - Mirrors key state with either pressed or released
 *  nk_input_button     - Mirrors mouse button state with either pressed or released
 *  nk_input_scroll     - Mirrors mouse scroll values
 *  nk_input_char       - Adds a single ASCII text character into an internal text buffer
 *  nk_input_glyph      - Adds a single multi-byte UTF-8 character into an internal text buffer
 *  nk_input_unicode    - Adds a single unicode rune into an internal text buffer
 *  nk_input_end        - Ends the input mirroring process by calculating state changes. Don't call any \`nk_input_xxx\` function referenced above after this call
 */
enum nk_keys {
    NK_KEY_NONE,
    NK_KEY_SHIFT,
    NK_KEY_CTRL,
    NK_KEY_DEL,
    NK_KEY_ENTER,
    NK_KEY_TAB,
    NK_KEY_BACKSPACE,
    NK_KEY_COPY,
    NK_KEY_CUT,
    NK_KEY_PASTE,
    NK_KEY_UP,
    // NK_KEY_DOWN COMMENT
    NK_KEY_DOWN,
    NK_KEY_LEFT,
    NK_KEY_RIGHT,
    /* Shortcuts: text field */
    NK_KEY_TEXT_INSERT_MODE,
    NK_KEY_TEXT_REPLACE_MODE,
    NK_KEY_TEXT_RESET_MODE,
    NK_KEY_TEXT_LINE_START,
    NK_KEY_TEXT_LINE_END,
    NK_KEY_TEXT_START,

    /**
     * Multi line member
     * commento :-)
     */
    NK_KEY_TEXT_END,
    NK_KEY_TEXT_UNDO,
    NK_KEY_TEXT_REDO,
    NK_KEY_TEXT_SELECT_ALL,
    NK_KEY_TEXT_WORD_LEFT,
    NK_KEY_TEXT_WORD_RIGHT,
    /* Shortcuts: scrollbar */
    NK_KEY_SCROLL_START,
    NK_KEY_SCROLL_END,
    NK_KEY_SCROLL_DOWN,
    NK_KEY_SCROLL_UP,
    NK_KEY_MAX
};
enum nk_buttons {
    NK_BUTTON_LEFT,
    NK_BUTTON_MIDDLE,
    NK_BUTTON_RIGHT,
    NK_BUTTON_DOUBLE,
    NK_BUTTON_MAX
};
`;


const ENUMS_SINGLE_LINE =
`
/*
*  nk_convert          - Converts from the abstract draw commands list into a hardware accessible vertex format
*  nk__draw_begin      - Returns the first vertex command in the context vertex draw list to be executed
*  nk__draw_next       - Increments the vertex command iterator to the next command inside the context vertex command list
*  nk__draw_end        - Returns the end of the vertex draw list
*  nk_draw_foreach     - Iterates over each vertex draw command inside the vertex draw list
*/
enum nk_anti_aliasing {NK_ANTI_ALIASING_OFF, NK_ANTI_ALIASING_ON};
enum nk_convert_result {
   NK_CONVERT_SUCCESS = 0,
   NK_CONVERT_INVALID_PARAM = 1,
   /* inner comment for NK_CONVERT_COMMAND_BUFFER_FULL */
   NK_CONVERT_COMMAND_BUFFER_FULL = NK_FLAG(1),
   NK_CONVERT_VERTEX_BUFFER_FULL = NK_FLAG(2), /* inline adjacent comment  */
   NK_CONVERT_ELEMENT_BUFFER_FULL = NK_FLAG(3)
};
`

const MACROS = 
`/*  nk__next - Returns a draw command list iterator to iterate all draw
*  Parameters:
*      @ctx must point to an previously initialized \`nk_context\` struct at the end of a frame
*      @cmd must point to an previously a draw command either returned by \`nk__begin\` or \`nk__next\`
*  Return values:
*      draw command pointer pointing to the next command inside the draw command list  */
NK_API const struct nk_command* nk__next(struct nk_context*, const struct nk_command*);
/*  nk_foreach - Iterates over each draw command inside the context draw command list
*  Parameters:
*      @ctx must point to an previously initialized \`nk_context\` struct at the end of a frame
*      @cmd pointer initialized to NULL */
#define nk_foreach(c, ctx) for((c) = nk__begin(ctx); (c) != 0; (c) = nk__next(ctx,c))
// common for NK_INCLUDE_VERTEX_BUFFER_OUTPUT
#ifdef NK_INCLUDE_VERTEX_BUFFER_OUTPUT
/*  nk_convert - converts all internal draw command into vertex draw commands and fills
*  three buffers with vertexes, vertex draw commands and vertex indices. The vertex format
*  as well as some other configuration values have to be configured by filling out a
*  \`nk_convert_config\` struct.
*  Parameters:
*      @ctx must point to an previously initialized \`nk_context\` struct at the end of a frame
*      @cmds must point to a previously initialized buffer to hold converted vertex draw commands
*      @vertices must point to a previously initialized buffer to hold all produced vertices
*      @elements must point to a previously initialized buffer to hold all produced vertex indices
*      @config must point to a filled out \`nk_config\` struct to configure the conversion process
*  Returns:NK_API nk_flags nk_convert(struct nk_context*, struct nk_buffer *cmds, struct nk_buffer *vertices, struct nk_buffer *elements, const struct nk_convert_config*);

*      returns NK_CONVERT_SUCCESS on success and a enum nk_convert_result error values if not */
NK_API nk_flags nk_convert(struct nk_context*, struct nk_buffer *cmds, struct nk_buffer *vertices, struct nk_buffer *elements, const struct nk_convert_config*);
`;

const EXAMPLE_1 = `

/*
* ==============================================================
*
*                          MATH
*
* ===============================================================
*/
/*  Since nuklear is supposed to work on all systems providing floating point
   math without any dependencies I also had to implement my own math functions
   for sqrt, sin and cos. Since the actual highly accurate implementations for
   the standard library functions are quite complex and I do not need high
   precision for my use cases I use approximations.

   Sqrt
   ----
   For square root nuklear uses the famous fast inverse square root:
   https://en.wikipedia.org/wiki/Fast_inverse_square_root with
   slightly tweaked magic constant. While on today's hardware it is
   probably not faster it is still fast and accurate enough for
   nuklear's use cases. IMPORTANT: this requires float format IEEE 754

   Sine/Cosine
   -----------
   All constants inside both function are generated Remez's minimax
   approximations for value range 0...2*PI. The reason why I decided to
   approximate exactly that range is that nuklear only needs sine and
   cosine to generate circles which only requires that exact range.
   In addition I used Remez instead of Taylor for additional precision:
   www.lolengine.net/blog/2011/12/21/better-function-approximations.

   The tool I used to generate constants for both sine and cosine
   (it can actually approximate a lot more functions) can be
   found here: www.lolengine.net/wiki/oss/lolremez
*/
NK_INTERN float
nk_inv_sqrt(float number)
{
   float x2;
   const float threehalfs = 1.5f;
   union {nk_uint i; float f;} conv = {0};
   conv.f = number;
   x2 = number * 0.5f;
   conv.i = 0x5f375A84 - (conv.i >> 1);
   conv.f = conv.f * (threehalfs - (x2 * conv.f * conv.f));
   return conv.f;
}

NK_INTERN float
nk_sqrt(float x)
{
   return x * nk_inv_sqrt(x);
}
`

const SAMPLES = {
  STRUCT_FUNCS,
  STRUCT_DECLS,
  STRUCT,
  STRUCT_DOC,
  FUNC,
  COMM_SPACES,
  ENUMS,
  ENUMS_SINGLE_LINE,
  MACROS,
  EXAMPLE_1
};

module.exports = SAMPLES;
