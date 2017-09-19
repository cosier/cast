/*
 Nuklear - 2.00.0 - public domain
 no warranty implied; use at your own risk.
 authored from 2015-2017 by Micha Mettke

ABOUT:
    This is a minimal state graphical user interface single header toolkit
    written in ANSI C and licensed under public domain.
    It was designed as a simple embeddable user interface for application and does
    not have any dependencies, a default renderbackend or OS window and input handling
    but instead provides a very modular library approach by using simple input state
    for input and draw commands describing primitive shapes as output.
    So instead of providing a layered library that tries to abstract over a number
    of platform and render backends it only focuses on the actual UI.

VALUES:
    - Graphical user interface toolkit
    - Single header library
    - Written in C89 (a.k.a. ANSI C or ISO C90)
    - Small codebase (~18kLOC)
    - Focus on portability, efficiency and simplicity
    - No dependencies (not even the standard library if not wanted)
    - Fully skinnable and customizable
    - Low memory footprint with total memory control if needed or wanted
    - UTF-8 support
    - No global or hidden state
    - Customizable library modules (you can compile and use only what you need)
    - Optional font baker and vertex buffer output

USAGE:
    This library is self contained in one single header file and can be used either
    in header only mode or in implementation mode. The header only mode is used
    by default when included and allows including this header in other headers
    and does not contain the actual implementation.

    The implementation mode requires to define  the preprocessor macro
    NK_IMPLEMENTATION in *one* .c/.cpp file before #includeing this file, e.g.:

        #define NK_IMPLEMENTATION
        #include "nuklear.h"

    Also optionally define the symbols listed in the section "OPTIONAL DEFINES"
    below in header and implementation mode if you want to use additional functionality
    or need more control over the library.
    IMPORTANT:  Every time you include "nuklear.h" you have to define the same flags.
                This is very important not doing it either leads to compiler errors
                or even worse stack corruptions.

FEATURES:
    - Absolutely no platform dependent code
    - Memory management control ranging from/to
        - Ease of use by allocating everything from standard library
        - Control every byte of memory inside the library
    - Font handling control ranging from/to
        - Use your own font implementation for everything
        - Use this libraries internal font baking and handling API
    - Drawing output control ranging from/to
        - Simple shapes for more high level APIs which already have drawing capabilities
        - Hardware accessible anti-aliased vertex buffer output
    - Customizable colors and properties ranging from/to
        - Simple changes to color by filling a simple color table
        - Complete control with ability to use skinning to decorate widgets
    - Bendable UI library with widget ranging from/to
        - Basic widgets like buttons, checkboxes, slider, ...
        - Advanced widget like abstract comboboxes, contextual menus,...
    - Compile time configuration to only compile what you need
        - Subset which can be used if you do not want to link or use the standard library
    - Can be easily modified to only update on user input instead of frame updates

OPTIONAL DEFINES:
    NK_PRIVATE
        If defined declares all functions as static, so they can only be accessed
        inside the file that contains the implementation

    NK_INCLUDE_FIXED_TYPES
        If defined it will include header <stdint.h> for fixed sized types
        otherwise nuklear tries to select the correct type. If that fails it will
        throw a compiler error and you have to select the correct types yourself.
        <!> If used needs to be defined for implementation and header <!>

    NK_INCLUDE_DEFAULT_ALLOCATOR
        if defined it will include header <stdlib.h> and provide additional functions
        to use this library without caring for memory allocation control and therefore
        ease memory management.
        <!> Adds the standard library with malloc and free so don't define if you
            don't want to link to the standard library <!>
        <!> If used needs to be defined for implementation and header <!>

    NK_INCLUDE_STANDARD_IO
        if defined it will include header <stdio.h> and provide
        additional functions depending on file loading.
        <!> Adds the standard library with fopen, fclose,... so don't define this
            if you don't want to link to the standard library <!>
        <!> If used needs to be defined for implementation and header <!>

    NK_INCLUDE_STANDARD_VARARGS
        if defined it will include header <stdarg.h> and provide
        additional functions depending on variable arguments
        <!> Adds the standard library with va_list and  so don't define this if
            you don't want to link to the standard library<!>
        <!> If used needs to be defined for implementation and header <!>

    NK_INCLUDE_VERTEX_BUFFER_OUTPUT
        Defining this adds a vertex draw command list backend to this
        library, which allows you to convert queue commands into vertex draw commands.
        This is mainly if you need a hardware accessible format for OpenGL, DirectX,
        Vulkan, Metal,...
        <!> If used needs to be defined for implementation and header <!>

    NK_INCLUDE_FONT_BAKING
        Defining this adds `stb_truetype` and `stb_rect_pack` implementation
        to this library and provides font baking and rendering.
        If you already have font handling or do not want to use this font handler
        you don't have to define it.
        <!> If used needs to be defined for implementation and header <!>

    NK_INCLUDE_DEFAULT_FONT
        Defining this adds the default font: ProggyClean.ttf into this library
        which can be loaded into a font atlas and allows using this library without
        having a truetype font
        <!> Enabling this adds ~12kb to global stack memory <!>
        <!> If used needs to be defined for implementation and header <!>

    NK_INCLUDE_COMMAND_USERDATA
        Defining this adds a userdata pointer into each command. Can be useful for
        example if you want to provide custom shaders depending on the used widget.
        Can be combined with the style structures.
        <!> If used needs to be defined for implementation and header <!>

    NK_BUTTON_TRIGGER_ON_RELEASE
        Different platforms require button clicks occurring either on buttons being
        pressed (up to down) or released (down to up).
        By default this library will react on buttons being pressed, but if you
        define this it will only trigger if a button is released.
        <!> If used it is only required to be defined for the implementation part <!>

    NK_ZERO_COMMAND_MEMORY
        Defining this will zero out memory for each drawing command added to a
        drawing queue (inside nk_command_buffer_push). Zeroing command memory
        is very useful for fast checking (using memcmp) if command buffers are
        equal and avoid drawing frames when nothing on screen has changed since
        previous frame.

    NK_ASSERT
        If you don't define this, nuklear will use <assert.h> with assert().
        <!> Adds the standard library so define to nothing of not wanted <!>
        <!> If used needs to be defined for implementation and header <!>

    NK_BUFFER_DEFAULT_INITIAL_SIZE
        Initial buffer size allocated by all buffers while using the default allocator
        functions included by defining NK_INCLUDE_DEFAULT_ALLOCATOR. If you don't
        want to allocate the default 4k memory then redefine it.
        <!> If used needs to be defined for implementation and header <!>

    NK_MAX_NUMBER_BUFFER
        Maximum buffer size for the conversion buffer between float and string
        Under normal circumstances this should be more than sufficient.
        <!> If used needs to be defined for implementation and header <!>

    NK_INPUT_MAX
        Defines the max number of bytes which can be added as text input in one frame.
        Under normal circumstances this should be more than sufficient.
        <!> If used it is only required to be defined for the implementation part <!>

    NK_MEMSET
        You can define this to 'memset' or your own memset implementation
        replacement. If not nuklear will use its own version.
        <!> If used it is only required to be defined for the implementation part <!>

    NK_MEMCPY
        You can define this to 'memcpy' or your own memcpy implementation
        replacement. If not nuklear will use its own version.
        <!> If used it is only required to be defined for the implementation part <!>

    NK_SQRT
        You can define this to 'sqrt' or your own sqrt implementation
        replacement. If not nuklear will use its own slow and not highly
        accurate version.
        <!> If used it is only required to be defined for the implementation part <!>

    NK_SIN
        You can define this to 'sinf' or your own sine implementation
        replacement. If not nuklear will use its own approximation implementation.
        <!> If used it is only required to be defined for the implementation part <!>

    NK_COS
        You can define this to 'cosf' or your own cosine implementation
        replacement. If not nuklear will use its own approximation implementation.
        <!> If used it is only required to be defined for the implementation part <!>

    NK_STRTOD
        You can define this to `strtod` or your own string to double conversion
        implementation replacement. If not defined nuklear will use its own
        imprecise and possibly unsafe version (does not handle nan or infinity!).
        <!> If used it is only required to be defined for the implementation part <!>

    NK_DTOA
        You can define this to `dtoa` or your own double to string conversion
        implementation replacement. If not defined nuklear will use its own
        imprecise and possibly unsafe version (does not handle nan or infinity!).
        <!> If used it is only required to be defined for the implementation part <!>

    NK_VSNPRINTF
        If you define `NK_INCLUDE_STANDARD_VARARGS` as well as `NK_INCLUDE_STANDARD_IO`
        and want to be safe define this to `vsnprintf` on compilers supporting
        later versions of C or C++. By default nuklear will check for your stdlib version
        in C as well as compiler version in C++. if `vsnprintf` is available
        it will define it to `vsnprintf` directly. If not defined and if you have
        older versions of C or C++ it will be defined to `vsprintf` which is unsafe.
        <!> If used it is only required to be defined for the implementation part <!>

    NK_BYTE
    NK_INT16
    NK_UINT16
    NK_INT32
    NK_UINT32
    NK_SIZE_TYPE
    NK_POINTER_TYPE
        If you compile without NK_USE_FIXED_TYPE then a number of standard types
        will be selected and compile time validated. If they are incorrect you can
        define the correct types by overloading these type defines.

CREDITS:
    Developed by Micha Mettke and every direct or indirect contributor.

    Embeds stb_texedit, stb_truetype and stb_rectpack by Sean Barret (public domain)
    Embeds ProggyClean.ttf font by Tristan Grimmer (MIT license).

    Big thank you to Omar Cornut (ocornut@github) for his imgui library and
    giving me the inspiration for this library, Casey Muratori for handmade hero
    and his original immediate mode graphical user interface idea and Sean
    Barret for his amazing single header libraries which restored my faith
    in libraries and brought me to create some of my own.

LICENSE:
    This software is dual-licensed to the public domain and under the following
    license: you are granted a perpetual, irrevocable license to copy, modify,
    publish and distribute this file as you see fit.
*/

/*  nk_init_default - Initializes a `nk_context` struct with a default standard library allocator.
 *  Should be used if you don't want to be bothered with memory management in nuklear.
 *  Parameters:
 *      @ctx must point to an either stack or heap allocated `nk_context` struct
 *      @font must point to a previously initialized font handle for more info look at font documentation
 *  Return values:
 *      true(1) on success
 *      false(0) on failure */
NK_API int nk_init_default(struct nk_context*, const struct nk_user_font*);

/* ============================================================================
 *
 *                                  API
 *
 * =========================================================================== */
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
struct nk_style_button;
struct nk_style_toggle;
struct nk_style_selectable;
struct nk_style_slide;
struct nk_style_progress;
struct nk_style_scrollbar;
struct nk_style_edit;
struct nk_style_property;
struct nk_style_chart;
struct nk_style_combo;
struct nk_style_tab;
struct nk_style_window_header;
struct nk_style_window;

/* =============================================================================
 *
 *                                  CONTEXT
 *
 * =============================================================================*/
/*  Contexts are the main entry point and the majestro of nuklear and contain all required state.
 *  They are used for window, memory, input, style, stack, commands and time management and need
 *  to be passed into all nuklear GUI specific functions.
 *
 *  Usage
 *  -------------------
 *  To use a context it first has to be initialized which can be achieved by calling
 *  one of either `nk_init_default`, `nk_init_fixed`, `nk_init`, `nk_init_custom`.
 *  Each takes in a font handle and a specific way of handling memory. Memory control
 *  hereby ranges from standard library to just specifying a fixed sized block of memory
 *  which nuklear has to manage itself from.
 *
 *      struct nk_context ctx;
 *      nk_init_xxx(&ctx, ...);
 *      while (1) {
 *          [...]
 *          nk_clear(&ctx);
 *      }
 *      nk_free(&ctx);
 *
 *  Reference
 *  -------------------
 *  nk_init_default     - Initializes context with standard library memory allocation (malloc,free)
 *  nk_init_fixed       - Initializes context from single fixed size memory block
 *  nk_init             - Initializes context with memory allocator callbacks for alloc and free
 *  nk_init_custom      - Initializes context from two buffers. One for draw commands the other for window/panel/table allocations
 *  nk_clear            - Called at the end of the frame to reset and prepare the context for the next frame
 *  nk_free             - Shutdown and free all memory allocated inside the context
 *  nk_set_user_data    - Utility function to pass user data to draw command
 */
#ifdef NK_INCLUDE_DEFAULT_ALLOCATOR
/*  nk_init_default - Initializes a `nk_context` struct with a default standard library allocator.
 *  Should be used if you don't want to be bothered with memory management in nuklear.
 *  Parameters:
 *      @ctx must point to an either stack or heap allocated `nk_context` struct
 *      @font must point to a previously initialized font handle for more info look at font documentation
 *  Return values:
 *      true(1) on success
 *      false(0) on failure */
NK_API int nk_init_default(struct nk_context*, const struct nk_user_font*);
#endif
/*  nk_init_fixed - Initializes a `nk_context` struct from a single fixed size memory block
 *  Should be used if you want complete control over nuklear's memory management.
 *  Especially recommended for system with little memory or systems with virtual memory.
 *  For the later case you can just allocate for example 16MB of virtual memory
 *  and only the required amount of memory will actually be committed.
 *  IMPORTANT: make sure the passed memory block is aligned correctly for `nk_draw_commands`
 *  Parameters:
 *      @ctx must point to an either stack or heap allocated `nk_context` struct
 *      @memory must point to a previously allocated memory block
 *      @size must contain the total size of @memory
 *      @font must point to a previously initialized font handle for more info look at font documentation
 *  Return values:
 *      true(1) on success
 *      false(0) on failure */
NK_API int nk_init_fixed(struct nk_context*, void *memory, nk_size size, const struct nk_user_font*);
/*  nk_init - Initializes a `nk_context` struct with memory allocation callbacks for nuklear to allocate
 *  memory from. Used internally for `nk_init_default` and provides a kitchen sink allocation
 *  interface to nuklear. Can be useful for cases like monitoring memory consumption.
 *  Parameters:
 *      @ctx must point to an either stack or heap allocated `nk_context` struct
 *      @alloc must point to a previously allocated memory allocator
 *      @font must point to a previously initialized font handle for more info look at font documentation
 *  Return values:
 *      true(1) on success
 *      false(0) on failure */
NK_API int nk_init(struct nk_context*, struct nk_allocator*, const struct nk_user_font*);
/*  nk_init_custom - Initializes a `nk_context` struct from two different either fixed or growing
 *  buffers. The first buffer is for allocating draw commands while the second buffer is
 *  used for allocating windows, panels and state tables.
 *  Parameters:
 *      @ctx must point to an either stack or heap allocated `nk_context` struct
 *      @cmds must point to a previously initialized memory buffer either fixed or dynamic to store draw commands into
 *      @pool must point to a previously initialized memory buffer either fixed or dynamic to store windows, panels and tables
 *      @font must point to a previously initialized font handle for more info look at font documentation
 *  Return values:
 *      true(1) on success
 *      false(0) on failure */
NK_API int nk_init_custom(struct nk_context*, struct nk_buffer *cmds, struct nk_buffer *pool, const struct nk_user_font*);
/*  nk_clear - Resets the context state at the end of the frame. This includes mostly
 *  garbage collector tasks like removing windows or table not called and therefore
 *  used anymore.
 *  Parameters:
 *      @ctx must point to a previously initialized `nk_context` struct */
NK_API void nk_clear(struct nk_context*);
/*  nk_free - Frees all memory allocated by nuklear. Not needed if context was
 *  initialized with `nk_init_fixed`.
 *  Parameters:
 *      @ctx must point to a previously initialized `nk_context` struct */
NK_API void nk_free(struct nk_context*);
#ifdef NK_INCLUDE_COMMAND_USERDATA
/*  nk_set_user_data - Sets the currently passed userdata passed down into each draw command.
 *  Parameters:
 *      @ctx must point to a previously initialized `nk_context` struct
 *      @data handle with either pointer or index to be passed into every draw commands */
NK_API void nk_set_user_data(struct nk_context*, nk_handle handle);
#endif
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
 *  Input state needs to be provided to nuklear by first calling `nk_input_begin`
 *  which resets internal state like delta mouse position and button transistions.
 *  After `nk_input_begin` all current input state needs to be provided. This includes
 *  mouse motion, button and key pressed and released, text input and scrolling.
 *  Both event- or state-based input handling are supported by this API
 *  and should work without problems. Finally after all input state has been
 *  mirrored `nk_input_end` needs to be called to finish input process.
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
 *  nk_input_begin      - Begins the input mirroring process. Needs to be called before all other `nk_input_xxx` calls
 *  nk_input_motion     - Mirrors mouse cursor position
 *  nk_input_key        - Mirrors key state with either pressed or released
 *  nk_input_button     - Mirrors mouse button state with either pressed or released
 *  nk_input_scroll     - Mirrors mouse scroll values
 *  nk_input_char       - Adds a single ASCII text character into an internal text buffer
 *  nk_input_glyph      - Adds a single multi-byte UTF-8 character into an internal text buffer
 *  nk_input_unicode    - Adds a single unicode rune into an internal text buffer
 *  nk_input_end        - Ends the input mirroring process by calculating state changes. Don't call any `nk_input_xxx` function referenced above after this call
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
/*  nk_input_begin - Begins the input mirroring process by resetting text, scroll
 *  mouse previous mouse position and movement as well as key state transitions,
 *  Parameters:
 *      @ctx must point to an previously initialized `nk_context` struct */
NK_API void nk_input_begin(struct nk_context*);
/*  nk_input_motion - Mirrors current mouse position to nuklear
 *  Parameters:
 *      @ctx must point to an previously initialized `nk_context` struct
 *      @x must contain an integer describing the current mouse cursor x-position
 *      @y must contain an integer describing the current mouse cursor y-position */
NK_API void nk_input_motion(struct nk_context*, int x, int y);
/*  nk_input_key - Mirrors state of a specific key to nuklear
 *  Parameters:
 *      @ctx must point to an previously initialized `nk_context` struct
 *      @key must be any value specified in enum `nk_keys` that needs to be mirrored
 *      @down must be 0 for key is up and 1 for key is down */
NK_API void nk_input_key(struct nk_context*, enum nk_keys, int down);
/*  nk_input_button - Mirrors the state of a specific mouse button to nuklear
 *  Parameters:
 *      @ctx must point to an previously initialized `nk_context` struct
 *      @nk_buttons must be any value specified in enum `nk_buttons` that needs to be mirrored
 *      @x must contain an integer describing mouse cursor x-position on click up/down
 *      @y must contain an integer describing mouse cursor y-position on click up/down
 *      @down must be 0 for key is up and 1 for key is down */
NK_API void nk_input_button(struct nk_context*, enum nk_buttons, int x, int y, int down);
/*  nk_input_scroll - Copies the last mouse scroll value to nuklear. Is generally
 *  a  scroll value. So does not have to come from mouse and could also originate
 *  from touch for example.
 *  Parameters:
 *      @ctx must point to an previously initialized `nk_context` struct
 *      @val vector with both X- as well as Y-scroll value */
NK_API void nk_input_scroll(struct nk_context*, struct nk_vec2 val);
/*  nk_input_char - Copies a single ASCII character into an internal text buffer
 *  This is basically a helper function to quickly push ASCII characters into
 *  nuklear. Note that you can only push up to NK_INPUT_MAX bytes into
 *  struct `nk_input` between `nk_input_begin` and `nk_input_end`.
 *  Parameters:
 *      @ctx must point to an previously initialized `nk_context` struct
 *      @c must be a single ASCII character preferable one that can be printed */
NK_API void nk_input_char(struct nk_context*, char);
/*  nk_input_unicode - Converts a encoded unicode rune into UTF-8 and copies the result
 *  into an internal text buffer.
 *  Note that you can only push up to NK_INPUT_MAX bytes into
 *  struct `nk_input` between `nk_input_begin` and `nk_input_end`.
 *  Parameters:
 *      @ctx must point to an previously initialized `nk_context` struct
 *      @glyph UTF-32 unicode codepoint */
NK_API void nk_input_glyph(struct nk_context*, const nk_glyph);
/*  nk_input_unicode - Converts a unicode rune into UTF-8 and copies the result
 *  into an internal text buffer.
 *  Note that you can only push up to NK_INPUT_MAX bytes into
 *  struct `nk_input` between `nk_input_begin` and `nk_input_end`.
 *  Parameters:
 *      @ctx must point to an previously initialized `nk_context` struct
 *      @glyph UTF-32 unicode codepoint */
NK_API void nk_input_unicode(struct nk_context*, nk_rune);
/*  nk_input_end - End the input mirroring process by resetting mouse grabbing
 *  state to ensure the mouse cursor is not grabbed indefinitely.
 *  Parameters:
 *      @ctx must point to an previously initialized `nk_context` struct */
NK_API void nk_input_end(struct nk_context*);
/* =============================================================================
 *
 *                                  DRAWING
 *
 * =============================================================================*/
/*  This library was designed to be render backend agnostic so it does
 *  not draw anything to screen directly. Instead all drawn shapes, widgets
 *  are made of, are buffered into memory and make up a command queue.
 *  Each frame therefore fills the command buffer with draw commands
 *  that then need to be executed by the user and his own render backend.
 *  After that the command buffer needs to be cleared and a new frame can be
 *  started. It is probably important to note that the command buffer is the main
 *  drawing API and the optional vertex buffer API only takes this format and
 *  converts it into a hardware accessible format.
 *
 *  Usage
 *  -------------------
 *  To draw all draw commands accumulated over a frame you need your own render
 *  backend able to draw a number of 2D primitives. This includes at least
 *  filled and stroked rectangles, circles, text, lines, triangles and scissors.
 *  As soon as this criterion is met you can iterate over each draw command
 *  and execute each draw command in a interpreter like fashion:
 *
 *      const struct nk_command *cmd = 0;
 *      nk_foreach(cmd, &ctx) {
 *      switch (cmd->type) {
 *      case NK_COMMAND_LINE:
 *          your_draw_line_function(...)
 *          break;
 *      case NK_COMMAND_RECT
 *          your_draw_rect_function(...)
 *          break;
 *      case ...:
 *          [...]
 *      }
 *
 *  In program flow context draw commands need to be executed after input has been
 *  gathered and the complete UI with windows and their contained widgets have
 *  been executed and before calling `nk_clear` which frees all previously
 *  allocated draw commands.
 *
 *      struct nk_context ctx;
 *      nk_init_xxx(&ctx, ...);
 *      while (1) {
 *          Event evt;
 *          nk_input_begin(&ctx);
 *          while (GetEvent(&evt)) {
 *              if (evt.type == MOUSE_MOVE)
 *                  nk_input_motion(&ctx, evt.motion.x, evt.motion.y);
 *              else if (evt.type == [...]) {
 *                  [...]
 *              }
 *          }
 *          nk_input_end(&ctx);
 *
 *          [...]
 *
 *          const struct nk_command *cmd = 0;
 *          nk_foreach(cmd, &ctx) {
 *          switch (cmd->type) {
 *          case NK_COMMAND_LINE:
 *              your_draw_line_function(...)
 *              break;
 *          case NK_COMMAND_RECT
 *              your_draw_rect_function(...)
 *              break;
 *          case ...:
 *              [...]
 *          }
 *          nk_clear(&ctx);
 *      }
 *      nk_free(&ctx);
 *
 *  You probably noticed that you have to draw all of the UI each frame which is
 *  quite wasteful. While the actual UI updating loop is quite fast rendering
 *  without actually needing it is not. So there are multiple things you could do.
 *
 *  First is only update on input. This of course is only an option if your
 *  application only depends on the UI and does not require any outside calculations.
 *  If you actually only update on input make sure to update the UI two times each
 *  frame and call `nk_clear` directly after the first pass and only draw in
 *  the second pass. In addition it is recommended to also add additional timers
 *  to make sure the UI is not drawn more than a fixed number of frames per second.
 *
 *      struct nk_context ctx;
 *      nk_init_xxx(&ctx, ...);
 *      while (1) {
 *          [...wait for input ]
 *
 *          [...do two UI passes ...]
 *          do_ui(...)
 *          nk_clear(&ctx);
 *          do_ui(...)
 *
 *          const struct nk_command *cmd = 0;
 *          nk_foreach(cmd, &ctx) {
 *          switch (cmd->type) {
 *          case NK_COMMAND_LINE:
 *              your_draw_line_function(...)
 *              break;
 *          case NK_COMMAND_RECT
 *              your_draw_rect_function(...)
 *              break;
 *          case ...:
 *              [...]
 *          }
 *          nk_clear(&ctx);
 *      }
 *      nk_free(&ctx);
 *
 *  The second probably more applicable trick is to only draw if anything changed.
 *  It is not really useful for applications with continuous draw loop but
 *  quite useful for desktop applications. To actually get nuklear to only
 *  draw on changes you first have to define `NK_ZERO_COMMAND_MEMORY` and
 *  allocate a memory buffer that will store each unique drawing output.
 *  After each frame you compare the draw command memory inside the library
 *  with your allocated buffer by memcmp. If memcmp detects differences
 *  you have to copy the command buffer into the allocated buffer
 *  and then draw like usual (this example uses fixed memory but you could
 *  use dynamically allocated memory).
 *
 *      [... other defines ...]
 *      #define NK_ZERO_COMMAND_MEMORY
 *      #include "nuklear.h"
 *
 *      struct nk_context ctx;
 *      void *last = calloc(1,64*1024);
 *      void *buf = calloc(1,64*1024);
 *      nk_init_fixed(&ctx, buf, 64*1024);
 *      while (1) {
 *          [...input...]
 *          [...ui...]
 *
 *          void *cmds = nk_buffer_memory(&ctx.memory);
 *          if (memcmp(cmds, last, ctx.memory.allocated)) {
 *              memcpy(last,cmds,ctx.memory.allocated);
 *              const struct nk_command *cmd = 0;
 *              nk_foreach(cmd, &ctx) {
 *                  switch (cmd->type) {
 *                  case NK_COMMAND_LINE:
 *                      your_draw_line_function(...)
 *                      break;
 *                  case NK_COMMAND_RECT
 *                      your_draw_rect_function(...)
 *                      break;
 *                  case ...:
 *                      [...]
 *                  }
 *              }
 *          }
 *          nk_clear(&ctx);
 *      }
 *      nk_free(&ctx);
 *
 *  Finally while using draw commands makes sense for higher abstracted platforms like
 *  X11 and Win32 or drawing libraries it is often desirable to use graphics
 *  hardware directly. Therefore it is possible to just define
 *  `NK_INCLUDE_VERTEX_BUFFER_OUTPUT` which includes optional vertex output.
 *  To access the vertex output you first have to convert all draw commands into
 *  vertexes by calling `nk_convert` which takes in your preferred vertex format.
 *  After successfully converting all draw commands just iterate over and execute all
 *  vertex draw commands:
 *
 *      struct nk_convert_config cfg = {};
 *      static const struct nk_draw_vertex_layout_element vertex_layout[] = {
 *          {NK_VERTEX_POSITION, NK_FORMAT_FLOAT, NK_OFFSETOF(struct your_vertex, pos)},
 *          {NK_VERTEX_TEXCOORD, NK_FORMAT_FLOAT, NK_OFFSETOF(struct your_vertex, uv)},
 *          {NK_VERTEX_COLOR, NK_FORMAT_R8G8B8A8, NK_OFFSETOF(struct your_vertex, col)},
 *          {NK_VERTEX_LAYOUT_END}
 *      };
 *      cfg.shape_AA = NK_ANTI_ALIASING_ON;
 *      cfg.line_AA = NK_ANTI_ALIASING_ON;
 *      cfg.vertex_layout = vertex_layout;
 *      cfg.vertex_size = sizeof(struct your_vertex);
 *      cfg.vertex_alignment = NK_ALIGNOF(struct your_vertex);
 *      cfg.circle_segment_count = 22;
 *      cfg.curve_segment_count = 22;
 *      cfg.arc_segment_count = 22;
 *      cfg.global_alpha = 1.0f;
 *      cfg.null = dev->null;
 *
 *      struct nk_buffer cmds, verts, idx;
 *      nk_buffer_init_default(&cmds);
 *      nk_buffer_init_default(&verts);
 *      nk_buffer_init_default(&idx);
 *      nk_convert(&ctx, &cmds, &verts, &idx, &cfg);
 *      nk_draw_foreach(cmd, &ctx, &cmds) {
 *          if (!cmd->elem_count) continue;
 *          [...]
 *      }
 *      nk_buffer_free(&cms);
 *      nk_buffer_free(&verts);
 *      nk_buffer_free(&idx);
 *
 *  Reference
 *  -------------------
 *  nk__begin           - Returns the first draw command in the context draw command list to be drawn
 *  nk__next            - Increments the draw command iterator to the next command inside the context draw command list
 *  nk_foreach          - Iterates over each draw command inside the context draw command list
 *
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
    NK_CONVERT_COMMAND_BUFFER_FULL = NK_FLAG(1),
    NK_CONVERT_VERTEX_BUFFER_FULL = NK_FLAG(2),
    NK_CONVERT_ELEMENT_BUFFER_FULL = NK_FLAG(3)
};
struct nk_draw_null_texture {
    nk_handle texture; /* texture handle to a texture with a white pixel */
    struct nk_vec2 uv; /* coordinates to a white pixel in the texture  */
};
struct nk_convert_config {
    float global_alpha; /* global alpha value */
    enum nk_anti_aliasing line_AA; /* line anti-aliasing flag can be turned off if you are tight on memory */
    enum nk_anti_aliasing shape_AA; /* shape anti-aliasing flag can be turned off if you are tight on memory */
    unsigned circle_segment_count; /* number of segments used for circles: default to 22 */
    unsigned arc_segment_count; /* number of segments used for arcs: default to 22 */
    unsigned curve_segment_count; /* number of segments used for curves: default to 22 */
    struct nk_draw_null_texture null; /* handle to texture with a white pixel for shape drawing */
    const struct nk_draw_vertex_layout_element *vertex_layout; /* describes the vertex output format and packing */
    nk_size vertex_size; /* sizeof one vertex for vertex packing */
    nk_size vertex_alignment; /* vertex alignment: Can be obtained by NK_ALIGNOF */
};
/*  nk__begin - Returns a draw command list iterator to iterate all draw
 *  commands accumulated over one frame.
 *  Parameters:
 *      @ctx must point to an previously initialized `nk_context` struct at the end of a frame
 *  Return values:
 *      draw command pointer pointing to the first command inside the draw command list  */
NK_API const struct nk_command* nk__begin(struct nk_context*);
/*  nk__next - Returns a draw command list iterator to iterate all draw
 *  Parameters:
 *      @ctx must point to an previously initialized `nk_context` struct at the end of a frame
 *      @cmd must point to an previously a draw command either returned by `nk__begin` or `nk__next`
 *  Return values:
 *      draw command pointer pointing to the next command inside the draw command list  */
NK_API const struct nk_command* nk__next(struct nk_context*, const struct nk_command*);
/*  nk_foreach - Iterates over each draw command inside the context draw command list
 *  Parameters:
 *      @ctx must point to an previously initialized `nk_context` struct at the end of a frame
 *      @cmd pointer initialized to NULL */
#define nk_foreach(c, ctx) for((c) = nk__begin(ctx); (c) != 0; (c) = nk__next(ctx,c))
#ifdef NK_INCLUDE_VERTEX_BUFFER_OUTPUT
/*  nk_convert - converts all internal draw command into vertex draw commands and fills
 *  three buffers with vertexes, vertex draw commands and vertex indices. The vertex format
 *  as well as some other configuration values have to be configured by filling out a
 *  `nk_convert_config` struct.
 *  Parameters:
 *      @ctx must point to an previously initialized `nk_context` struct at the end of a frame
 *      @cmds must point to a previously initialized buffer to hold converted vertex draw commands
 *      @vertices must point to a previously initialized buffer to hold all produced vertices
 *      @elements must point to a previously initialized buffer to hold all produced vertex indices
 *      @config must point to a filled out `nk_config` struct to configure the conversion process
 *  Returns:
 *      returns NK_CONVERT_SUCCESS on success and a enum nk_convert_result error values if not */
NK_API nk_flags nk_convert(struct nk_context*, struct nk_buffer *cmds, struct nk_buffer *vertices, struct nk_buffer *elements, const struct nk_convert_config*);
/*  nk__draw_begin - Returns a draw vertex command buffer iterator to iterate each the vertex draw command buffer
 *  Parameters:
 *      @ctx must point to an previously initialized `nk_context` struct at the end of a frame
 *      @buf must point to an previously by `nk_convert` filled out vertex draw command buffer
 *  Return values:
 *      vertex draw command pointer pointing to the first command inside the vertex draw command buffer  */
NK_API const struct nk_draw_command* nk__draw_begin(const struct nk_context*, const struct nk_buffer*);
/*  nk__draw_end - Returns the vertex draw command  at the end of the vertex draw command buffer
 *  Parameters:
 *      @ctx must point to an previously initialized `nk_context` struct at the end of a frame
 *      @buf must point to an previously by `nk_convert` filled out vertex draw command buffer
 *  Return values:
 *      vertex draw command pointer pointing to the end of the last vertex draw command inside the vertex draw command buffer  */
NK_API const struct nk_draw_command* nk__draw_end(const struct nk_context*, const struct nk_buffer*);
/*  nk__draw_next - Increments the vertex draw command buffer iterator
 *  Parameters:
 *      @cmd must point to an previously either by `nk__draw_begin` or `nk__draw_next` returned vertex draw command
 *      @buf must point to an previously by `nk_convert` filled out vertex draw command buffer
 *      @ctx must point to an previously initialized `nk_context` struct at the end of a frame
 *  Return values:
 *      vertex draw command pointer pointing to the end of the last vertex draw command inside the vertex draw command buffer  */
NK_API const struct nk_draw_command* nk__draw_next(const struct nk_draw_command*, const struct nk_buffer*, const struct nk_context*);
/*  nk_draw_foreach - Iterates over each vertex draw command inside a vertex draw command buffer
 *  Parameters:
 *      @cmd nk_draw_command pointer set to NULL
 *      @buf must point to an previously by `nk_convert` filled out vertex draw command buffer
 *      @ctx must point to an previously initialized `nk_context` struct at the end of a frame */
#define nk_draw_foreach(cmd,ctx, b) for((cmd)=nk__draw_begin(ctx, b); (cmd)!=0; (cmd)=nk__draw_next(cmd, b, ctx))
#endif

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

NK_INTERN float
nk_sin(float x)
{
    NK_STORAGE const float a0 = +1.91059300966915117e-31f;
    NK_STORAGE const float a1 = +1.00086760103908896f;
    NK_STORAGE const float a2 = -1.21276126894734565e-2f;
    NK_STORAGE const float a3 = -1.38078780785773762e-1f;
    NK_STORAGE const float a4 = -2.67353392911981221e-2f;
    NK_STORAGE const float a5 = +2.08026600266304389e-2f;
    NK_STORAGE const float a6 = -3.03996055049204407e-3f;
    NK_STORAGE const float a7 = +1.38235642404333740e-4f;
    return a0 + x*(a1 + x*(a2 + x*(a3 + x*(a4 + x*(a5 + x*(a6 + x*a7))))));
}

NK_INTERN float
nk_cos(float x)
{
    NK_STORAGE const float a0 = +1.00238601909309722f;
    NK_STORAGE const float a1 = -3.81919947353040024e-2f;
    NK_STORAGE const float a2 = -3.94382342128062756e-1f;
    NK_STORAGE const float a3 = -1.18134036025221444e-1f;
    NK_STORAGE const float a4 = +1.07123798512170878e-1f;
    NK_STORAGE const float a5 = -1.86637164165180873e-2f;
    NK_STORAGE const float a6 = +9.90140908664079833e-4f;
    NK_STORAGE const float a7 = -5.23022132118824778e-14f;
    return a0 + x*(a1 + x*(a2 + x*(a3 + x*(a4 + x*(a5 + x*(a6 + x*a7))))));
}

NK_INTERN nk_uint
nk_round_up_pow2(nk_uint v)
{
    v--;
    v |= v >> 1;
    v |= v >> 2;
    v |= v >> 4;
    v |= v >> 8;
    v |= v >> 16;
    v++;
    return v;
}

NK_API struct nk_rect
nk_get_null_rect(void)
{
    return nk_null_rect;
}

NK_API struct nk_rect
nk_rect(float x, float y, float w, float h)
{
    struct nk_rect r;
    r.x = x; r.y = y;
    r.w = w; r.h = h;
    return r;
}

NK_API struct nk_rect
nk_recti(int x, int y, int w, int h)
{
    struct nk_rect r;
    r.x = (float)x;
    r.y = (float)y;
    r.w = (float)w;
    r.h = (float)h;
    return r;
}

NK_API struct nk_rect
nk_recta(struct nk_vec2 pos, struct nk_vec2 size)
{
    return nk_rect(pos.x, pos.y, size.x, size.y);
}

NK_API struct nk_rect
nk_rectv(const float *r)
{
    return nk_rect(r[0], r[1], r[2], r[3]);
}

NK_API struct nk_rect
nk_rectiv(const int *r)
{
    return nk_recti(r[0], r[1], r[2], r[3]);
}

NK_API struct nk_vec2
nk_rect_pos(struct nk_rect r)
{
    struct nk_vec2 ret;
    ret.x = r.x; ret.y = r.y;
    return ret;
}

NK_API struct nk_vec2
nk_rect_size(struct nk_rect r)
{
    struct nk_vec2 ret;
    ret.x = r.w; ret.y = r.h;
    return ret;
}

NK_INTERN struct nk_rect
nk_shrink_rect(struct nk_rect r, float amount)
{
    struct nk_rect res;
    r.w = NK_MAX(r.w, 2 * amount);
    r.h = NK_MAX(r.h, 2 * amount);
    res.x = r.x + amount;
    res.y = r.y + amount;
    res.w = r.w - 2 * amount;
    res.h = r.h - 2 * amount;
    return res;
}

NK_INTERN struct nk_rect
nk_pad_rect(struct nk_rect r, struct nk_vec2 pad)
{
    r.w = NK_MAX(r.w, 2 * pad.x);
    r.h = NK_MAX(r.h, 2 * pad.y);
    r.x += pad.x; r.y += pad.y;
    r.w -= 2 * pad.x;
    r.h -= 2 * pad.y;
    return r;
}

NK_API struct nk_vec2
nk_vec2(float x, float y)
{
    struct nk_vec2 ret;
    ret.x = x; ret.y = y;
    return ret;
}

NK_API struct nk_vec2
nk_vec2i(int x, int y)
{
    struct nk_vec2 ret;
    ret.x = (float)x;
    ret.y = (float)y;
    return ret;
}

NK_API struct nk_vec2
nk_vec2v(const float *v)
{
    return nk_vec2(v[0], v[1]);
}

NK_API struct nk_vec2
nk_vec2iv(const int *v)
{
    return nk_vec2i(v[0], v[1]);
}

