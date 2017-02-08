// compile with:
// g++ -std=c++11 -fmerge-all-constants -flto crash2.cpp
template<class T>
class foo {
  foo() {
    //int constexpr bar[2] = {0, 1};    // doesn't crash
    //int constexpr bar[2] = {1, 0};    // doesn't crash
    int constexpr bar[2] = {1, 1};      // crashes
  }
};
template class foo<int>;
