#include <cassert>

constexpr int ce(int r) {
  assert(r == 3);
  return r;
}

static_assert(ce(3) == 3, "static asser error");
