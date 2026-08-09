"""統合基幹業務システム「TSUBASA-Legacy」デモ用バックエンド。

架空の3社(つばさ航空 / みらい信用銀行 / さくらマート)の
レガシー業務システムを模したデモアプリ。
"""

import random
import string
from datetime import datetime

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

app = FastAPI(title="TSUBASA-Legacy 統合基幹業務システム")

# ---------------------------------------------------------------------------
# 航空: つばさ航空 (便運航・予約管理)
# ---------------------------------------------------------------------------

FLIGHTS = [
    {"flight_no": "TB101", "origin": "羽田", "dest": "新千歳", "dep": "07:30", "arr": "09:05", "aircraft": "B777-200", "status": "定刻", "seats_total": 405, "seats_booked": 372},
    {"flight_no": "TB215", "origin": "羽田", "dest": "伊丹", "dep": "08:00", "arr": "09:10", "aircraft": "B787-8", "status": "定刻", "seats_total": 335, "seats_booked": 298},
    {"flight_no": "TB330", "origin": "成田", "dest": "那覇", "dep": "09:45", "arr": "12:55", "aircraft": "A350-900", "status": "遅延(25分)", "seats_total": 369, "seats_booked": 351},
    {"flight_no": "TB412", "origin": "羽田", "dest": "福岡", "dep": "10:15", "arr": "12:10", "aircraft": "B767-300", "status": "定刻", "seats_total": 270, "seats_booked": 189},
    {"flight_no": "TB508", "origin": "中部", "dest": "新千歳", "dep": "11:00", "arr": "12:45", "aircraft": "B737-800", "status": "欠航", "seats_total": 166, "seats_booked": 0},
    {"flight_no": "TB621", "origin": "羽田", "dest": "鹿児島", "dep": "13:20", "arr": "15:15", "aircraft": "B787-9", "status": "定刻", "seats_total": 375, "seats_booked": 260},
]

RESERVATIONS = [
    {"pnr": "AB12CD", "name": "ヤマダ タロウ", "flight_no": "TB101", "class": "普通席", "status": "確約", "created": "2026-08-01 10:23"},
    {"pnr": "EF34GH", "name": "サトウ ハナコ", "flight_no": "TB215", "class": "プレミアム", "status": "確約", "created": "2026-08-02 14:51"},
    {"pnr": "IJ56KL", "name": "スズキ イチロウ", "flight_no": "TB330", "class": "普通席", "status": "キャンセル待ち", "created": "2026-08-03 09:12"},
]


class ReservationIn(BaseModel):
    name: str
    flight_no: str
    seat_class: str = "普通席"


@app.get("/api/flights")
def list_flights():
    return FLIGHTS


@app.get("/api/reservations")
def list_reservations():
    return RESERVATIONS


@app.post("/api/reservations")
def create_reservation(body: ReservationIn):
    flight = next((f for f in FLIGHTS if f["flight_no"] == body.flight_no), None)
    if flight is None:
        raise HTTPException(status_code=404, detail="該当便が存在しません")
    if flight["status"] == "欠航":
        raise HTTPException(status_code=400, detail="欠航便のため予約できません")
    pnr = "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
    rec = {
        "pnr": pnr,
        "name": body.name,
        "flight_no": body.flight_no,
        "class": body.seat_class,
        "status": "確約",
        "created": datetime.now().strftime("%Y-%m-%d %H:%M"),
    }
    RESERVATIONS.append(rec)
    flight["seats_booked"] += 1
    return rec


# ---------------------------------------------------------------------------
# 金融: みらい信用銀行 (口座・振込管理)
# ---------------------------------------------------------------------------

ACCOUNTS = [
    {"account_no": "0011234", "name": "ヤマダ タロウ", "type": "普通", "balance": 1523400, "branch": "本店営業部"},
    {"account_no": "0015678", "name": "サトウ ハナコ", "type": "普通", "balance": 384200, "branch": "新宿支店"},
    {"account_no": "0019012", "name": "カブシキガイシャ アオゾラショウジ", "type": "当座", "balance": 12890000, "branch": "本店営業部"},
    {"account_no": "0023456", "name": "スズキ イチロウ", "type": "定期", "balance": 5000000, "branch": "大阪支店"},
]

TRANSACTIONS = [
    {"id": 1, "date": "2026-08-05", "from_no": "0011234", "to_no": "0015678", "amount": 30000, "memo": "カイヒ 8ガツブン", "status": "完了"},
    {"id": 2, "date": "2026-08-06", "from_no": "0019012", "to_no": "0011234", "amount": 254000, "memo": "キュウヨ", "status": "完了"},
    {"id": 3, "date": "2026-08-07", "from_no": "0015678", "to_no": "0019012", "amount": 128000, "memo": "シハライ INV-2210", "status": "処理中"},
]


class TransferIn(BaseModel):
    from_no: str
    to_no: str
    amount: int
    memo: str = ""


@app.get("/api/accounts")
def list_accounts():
    return ACCOUNTS


@app.get("/api/transactions")
def list_transactions():
    return TRANSACTIONS


@app.post("/api/transfer")
def transfer(body: TransferIn):
    src = next((a for a in ACCOUNTS if a["account_no"] == body.from_no), None)
    dst = next((a for a in ACCOUNTS if a["account_no"] == body.to_no), None)
    if src is None or dst is None:
        raise HTTPException(status_code=404, detail="口座番号が存在しません")
    if body.amount <= 0:
        raise HTTPException(status_code=400, detail="金額が不正です")
    if src["balance"] < body.amount:
        raise HTTPException(status_code=400, detail="残高不足です")
    src["balance"] -= body.amount
    dst["balance"] += body.amount
    rec = {
        "id": len(TRANSACTIONS) + 1,
        "date": datetime.now().strftime("%Y-%m-%d"),
        "from_no": body.from_no,
        "to_no": body.to_no,
        "amount": body.amount,
        "memo": body.memo,
        "status": "完了",
    }
    TRANSACTIONS.append(rec)
    return rec


# ---------------------------------------------------------------------------
# 小売: さくらマート (在庫・売上管理)
# ---------------------------------------------------------------------------

INVENTORY = [
    {"sku": "S-0001", "name": "ミネラルウォーター 2L", "category": "飲料", "price": 128, "stock": 240, "reorder_point": 100},
    {"sku": "S-0002", "name": "食パン 6枚切", "category": "食品", "price": 158, "stock": 42, "reorder_point": 50},
    {"sku": "S-0003", "name": "洗濯洗剤 詰替", "category": "日用品", "price": 328, "stock": 88, "reorder_point": 40},
    {"sku": "S-0004", "name": "おにぎり 鮭", "category": "食品", "price": 138, "stock": 12, "reorder_point": 30},
    {"sku": "S-0005", "name": "ボールペン 黒", "category": "文具", "price": 108, "stock": 156, "reorder_point": 60},
]

SALES = [
    {"id": 1, "date": "2026-08-07", "sku": "S-0001", "qty": 24, "store": "上野店"},
    {"id": 2, "date": "2026-08-07", "sku": "S-0004", "qty": 48, "store": "上野店"},
    {"id": 3, "date": "2026-08-08", "sku": "S-0002", "qty": 15, "store": "川崎店"},
]


class SaleIn(BaseModel):
    sku: str
    qty: int
    store: str


@app.get("/api/inventory")
def list_inventory():
    return INVENTORY


@app.get("/api/sales")
def list_sales():
    return SALES


@app.post("/api/sales")
def register_sale(body: SaleIn):
    item = next((i for i in INVENTORY if i["sku"] == body.sku), None)
    if item is None:
        raise HTTPException(status_code=404, detail="商品コードが存在しません")
    if body.qty <= 0:
        raise HTTPException(status_code=400, detail="数量が不正です")
    if item["stock"] < body.qty:
        raise HTTPException(status_code=400, detail="在庫不足です")
    item["stock"] -= body.qty
    rec = {
        "id": len(SALES) + 1,
        "date": datetime.now().strftime("%Y-%m-%d"),
        "sku": body.sku,
        "qty": body.qty,
        "store": body.store,
    }
    SALES.append(rec)
    return rec


app.mount("/", StaticFiles(directory="static", html=True), name="static")
