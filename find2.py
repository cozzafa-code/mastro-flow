import io
src=open("components/CMDetailPanel.tsx","rb").read().replace(b"\r\n",b"\n").decode("utf-8")
for kw in ["nome: `Vano", "nome:`Vano", "nome: \"Vano", "const v = { id: Date.now()"]:
    i=src.find(kw)
    print(f"'{kw}' -> {i}")
