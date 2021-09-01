pragma solidity >=0.4.17;

contract SimpleContract {
    uint256 private result;

    function addition(uint256 a, uint256 b) public returns (uint256) {
        result = a + b;
        return result;
    }

    function get() public view returns (uint256) {
        return result;
    }
}
