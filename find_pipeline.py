s = open("components/CMDetailPanel.tsx", "r", encoding="utf-8").read().split("\n")
for i, l in enumerate(s):
    if "stepsCC.map" in l:
        start = max(0, i - 2)
        end = min(len(s), i + 40)
        for j in range(start, end):
            print(j+1, s[j])
        print("---")
