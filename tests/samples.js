
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

const SAMPLES = {
  STRUCT_FUNCS,
  STRUCT,
  FUNC
};

export default SAMPLES;
