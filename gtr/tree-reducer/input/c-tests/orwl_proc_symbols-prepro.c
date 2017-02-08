#include <setjmp.h>

typedef struct p99_jmpbuf0 p99_jmpbuf0;
struct p99_jmpbuf0 {
  _Bool const returning;
  jmp_buf buf;
};
typedef p99_jmpbuf0 p99_jmpbuf[1];

_Noreturn
void go_away(void);

/* inline necessary to produce bug */
inline
void stay_or_go(void* top, unsigned level) {
  if (level && top) go_away();
}

typedef struct toto toto;
extern toto* dummy;
int condition(toto *);

void something(void);

static p99_jmpbuf unwind_return;
static jmp_buf unwind_top;

void proc_read_request_static(void) {
  _Bool blk = 1;
  toto* bug = dummy;
  /* Is only assigned, never read, but must be volatile. */
  int volatile code = 0;
  if (setjmp(unwind_return[0].buf))
    return;
  for (; blk; blk = 0) {
    for (; blk; blk = 0) {
      for (; blk; blk = 0) {
        for (; blk; blk = 0) {
          for (; blk; blk = 0) {
            for (; blk; blk = 0) {
              for (; blk; blk = 0) {
                for (; blk; blk = 0) {
                  for (; blk; blk = 0) {
                    for (; blk; blk = 0) {
                      for (; blk; blk = 0) {
                        switch (!setjmp (unwind_top)) {
                          if (0) {
                            /* branch unreachable because there are cases 0 and 1 */
                          default:
                            code = 1;
                            break;
                          } else {
                          case 0 :
                            code = 1;
                            break;
                          case 1:
                            for (; blk; blk = 0) {
                              if (condition(bug)) {
                                // assignment necessary for bug
                                bug = 0;
                                /* will always call go_away, but the
                                   inlined call can't be replaced by a
                                   direct call to go_away */
                                stay_or_go(&unwind_top, 1);
                              }
                              for (; blk; blk = 0) {
                                for (; blk; blk = 0) {
                                  // call necessary for bug
                                  something();
                                }
                              }
                            }
                            break;
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  // Dead branch, never calls go_away.
  if (unwind_return[0].returning) go_away();
}
