template <class T>
class Foo
{
    template <class U>
    static bool Bar;
};

template<class T>
template<class U>
bool Foo<T>::Bar<U>;

int main()
{ }
