// Display Prime Numbers Between two Intervals When Larger Number is Entered first
// @filename example.c
// @author Bailey C

#include <stdio.h>

// Structure for managing prime input boundaries
typedef struct prime_input {
    int low;
    int high;
} prime_input;

// Main entry point
int main()
{
    int low, high;
    prime_input input;

    printf("Enter two numbers(intevals): ");
    scanf("%d %d", &input.low, &input.high);

    return determine_primes(input);
}

/**
 * Determines primes within a boundary
 */
int determine_primes(prime_input input)
{
    int i, flag, temp;
    if (low > high)
    {
        temp = low;
        low = high;
        high = temp;
    }

    printf("Prime numbers between %d and %d are: ", low, high);

    while (low < high)
    {
        flag = 0;
        for (i = 2; i <= low / 2; ++i)
        {
            if (low % i == 0)
            {
                flag = 1;
                break;
            }
        }

        if (flag == 0) printf("%d ", low);
        ++low;
    }
}