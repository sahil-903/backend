
class Solution {

admin

}

public:

long long getMaxScore(vector<int>& nums) {

long long score = 0; long long start = 0, size = nums.size();

while (start < size - 1) {

long long end = start + 1;

while (end < size && nums[end] <= nums[start]) {

end++;

}

if (end >= size) {

end = size - 1;

}

score += (end - start) * nums[start];

start = end;

return score;
 } 