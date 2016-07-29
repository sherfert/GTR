

class Base {


	public:
		Base(int i) {
		}

		virtual int get_i() {
			return 1;
		}
};

class Child : public Base {
	
	using Base::get_i;	
	public:
		Child(int param) : Base(get_i(param)) {
		}

		int get_i(int input) {
			return input * 2;
		}
};

int main() {
	Child child(20);
	return 0;
}
