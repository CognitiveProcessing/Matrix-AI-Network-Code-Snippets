import org.aimanj.protocol.AiManj;
import org.aimanj.protocol.core.DefaultBlockParameter;
import org.aimanj.protocol.core.DefaultBlockParameterName;
import org.aimanj.protocol.core.methods.response.ManBlock;
import org.aimanj.protocol.core.methods.response.ManGetBalance;
import org.aimanj.protocol.http.HttpService;
import org.aimanj.utils.Convert;

import java.io.IOException;
import java.math.BigInteger;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

public class GetTopHoldersMultiThreaded {
    static AiManj man3j = AiManj.build(new HttpService("https://api01.matrix.io"));
    static ConcurrentHashMap<String, BigInteger> addressesWithBalance = new ConcurrentHashMap<>();

    static void searchForAddressesWithBalances(int startBlock, int endBlock) {
        for (int i = startBlock; i < endBlock; i++) {
            try {
                ManBlock manBlock = man3j.manGetBlockByNumber(DefaultBlockParameter.valueOf(BigInteger.valueOf(i)), true).send();
                ManBlock.Block block = manBlock.getBlock();
                System.out.print(i + " ");
                for (ManBlock.TransactionResult transactionResult : block.getTransactions()) {
                    if (((ManBlock.TransactionObject) transactionResult.get()).getValue().compareTo(BigInteger.ZERO) > 0) {
                        addressesWithBalance.put(((ManBlock.TransactionObject) transactionResult.get()).getTo(), BigInteger.ZERO);
                    }
                }
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
        for (Map.Entry<String, BigInteger> entry : addressesWithBalance.entrySet()) {
            ManGetBalance balanceWei = null;
            try {
                balanceWei = man3j.manGetBalance(entry.getKey(), DefaultBlockParameterName.LATEST).send();
                List<Map<String, BigInteger>> balanceList = balanceWei.getBalance();
                entry.setValue(balanceList.get(0).get("balance"));
            } catch (Error | IOException error) {
                System.out.println(error);
            }
        }
    }

    static void sortAndDisplay() {
        Object[] array = addressesWithBalance.entrySet().toArray();
        Arrays.sort(array, (Comparator) (o1, o2) -> ((Map.Entry<String, BigInteger>) o2).getValue()
                .compareTo(((Map.Entry<String, BigInteger>) o1).getValue()));
        for (Object entry : array) {
            System.out.printf("%s: %s%n", ((Map.Entry<String, BigInteger>) entry).getKey(),
                    Convert.fromWei((((Map.Entry<String, BigInteger>) entry).getValue().toString()), Convert.Unit.MAN));

        }
    }

    public static void main(String[] args) throws IOException {
        BigInteger blockNumber = man3j.manGetBlockByNumber(DefaultBlockParameterName.LATEST, true).send().getBlock().getNumber();
        int blockNumberInt = blockNumber.intValue();
        int blockToStartSearching = blockNumberInt;
        int numberOfThreads = 5;
        int blocksForEachThread = 100;
        ExecutorService threadPool = Executors.newFixedThreadPool(numberOfThreads);
        for (int i = 0; i < numberOfThreads; i++) {
            int firstBlockToStartSearching = blockToStartSearching - blocksForEachThread;
            int lastBlockToStartSearching = blockToStartSearching;
            blockToStartSearching -= blocksForEachThread;
            threadPool.submit(() -> searchForAddressesWithBalances(firstBlockToStartSearching, lastBlockToStartSearching));
        }
        threadPool.shutdown();
        try {
            threadPool.awaitTermination(30, TimeUnit.MINUTES);
            sortAndDisplay();
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }
}
