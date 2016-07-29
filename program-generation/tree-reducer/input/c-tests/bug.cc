#include <cassert>
#include <cstring>
#include <iterator>

void test(const char* s)
{
   constexpr /*static*/ struct {const char* s;} ar[]={
      {"e4"},
      {"e5"},
      {"Nf3"},
      {"Nc6"},
      {"Bb5"},
      {"a6"}
   };

   auto it=std::begin(ar);
   auto compare=[&it](const char* s)
      {
         assert(std::strcmp(it->s,s)==0);
      };

   auto test=[&](const char* s)
      {
         it=std::begin(ar);
         compare(s);
      };

   test(s);
}

int main(int argc, const char* argv[])
{
   test(argv[1]);
   test(argv[2]);
   test(argv[3]);
   return 0;
}
