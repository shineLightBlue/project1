import requests
import json
BASE_URL = "http://120.76.216.27:8080"
def get_token():
    """
    通过第三方登录获取 token
    """
    url = f"{BASE_URL}/app/thirdLogin"
    headers = {
        "Accept": "*/*",
        "Content-Type": "application/json",
        "User-Agent": "Python-Demo"
    }
    body = {
        "thirdAccountType": "google",
        "thirdAccountId": "123123",
        "requestClient": "android"
    }
    resp = requests.post(url, headers=headers, json=body)
    print("第三方登录响应：", resp.text)
    if resp.status_code != 200:
        raise Exception("获取 token 失败")
    data = resp.json()
    token = data.get("data", {}).get("token") or data.get("token")
    if not token:
        raise Exception("返回中未找到 token，请检查后台返回结构")
    print("获取到 token:", token)
    return token

def call_asr_api(token):
    """
    调用 ASR Fast Transcribe
    """
    url = f"{BASE_URL}/api/asr/fast/transcribe"
    headers = {
        "Accept": "*/*",
        "Authorization": f"Bearer {token}",
        "User-Agent": "Python-Demo",
    }
#     使用帮助：
# 	languageCode是本次转写的语种，语种列表参考https://learn.microsoft.com/zh-cn/azure/ai-services/speech-service/language-support?tabs=stt
# 	model是模型，参考文本大模型列表
# 	platform平台，参考文本大模型列表
# 	duration音频时长
# 	filepath是本地文件路径
    # meta 是 JSON 字符串
    meta = {
        "transcribeId": "test",
        "userId": "cf442b303539a5424aa320e13545c79f3d",
        "languageCode": "zh-CN",
        "prompt": "MEETING_SUMMARIZE",
        "model": "gpt-4",
        "platform": "openai",
        "summaryLengthLimit": 200,
        "duration": "50"
    }
    # 音频文件路径：你改成自己的真实音频地址
    file_path = r"C:\Users\DELL\Desktop\2025"
    with open(file_path, "rb") as f:
        files = {
            "meta": (None, json.dumps(meta), "application/json"),
            "file": ("audio.wav", f, "audio/wav")
        }
        resp = requests.post(url, headers=headers, files=files)
    print("ASR 接口响应：", resp.text)
    return resp.text
if __name__ == "__main__":
    token = get_token()
    # 2. 使用 token 调用 ASR
    result = call_asr_api(token)
#     print("最终结果：", result)
