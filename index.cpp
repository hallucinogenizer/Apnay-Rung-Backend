#include <iostream>

using namespace std;

int main() {
    
    int **twoDarr = new int*[5];

    for(int i=0;i<5;i++) {
        twoDarr[i] = new int[3];
    }

    
    return 0;
}
