"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@heroui/button";
import { Input, Textarea } from "@heroui/input";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Link } from "@heroui/link";
import { Lightbulb, AlertTriangle } from "lucide-react";

import { ImageUpload } from "@/components/ui/image-upload";
import { FailureTypeSelector } from "@/components/ui/failure-type-selector";
import { handleApiError, showSuccessToast } from "@/lib/toast";
import { uploadFiles } from "@/lib/upload";

export default function SubmitPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    tagline: "",
    url: "",
    confession: "",
    tags: [] as string[],
    currentTag: "",
    failureType: "",
    logoFiles: [] as File[],
    galleryFiles: [] as File[],
  });

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardBody className="text-center p-8">
            <div className="text-6xl mb-4">🔒</div>
            <h1 className="text-2xl font-bold mb-4">需要登录</h1>
            <p className="text-foreground-600 mb-6">
              请先登录才能提交你的垃圾项目
            </p>
            <Button as={Link} color="primary" href="/api/auth/signin" size="lg">
              GitHub 登录
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  const handleAddTag = () => {
    if (formData.currentTag.trim() && formData.tags.length < 5) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, prev.currentTag.trim()],
        currentTag: "",
      }));
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 上传Logo
      let logoUrl = null;

      if (formData.logoFiles.length > 0) {
        const logoUrls = await uploadFiles(formData.logoFiles);

        logoUrl = logoUrls[0];
      }

      // 上传图片库
      let galleryUrls: string[] = [];

      if (formData.galleryFiles.length > 0) {
        galleryUrls = await uploadFiles(formData.galleryFiles);
      }

      const response = await fetch("/api/projects/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title,
          tagline: formData.tagline,
          url: formData.url || undefined,
          confession: formData.confession,
          logoUrl,
          galleryUrls,
          tags: formData.tags,
          failureType: formData.failureType,
        }),
      });

      const data = await response.json();

      if (data.success) {
        showSuccessToast("提交成功！", "你的垃圾项目已成功提交");
        router.push(`/projects/${data.project.id}`);
      } else {
        handleApiError(
          { response: { status: 400, data: { message: data.errors?.[0] } } },
          data.errors?.[0] || "提交失败",
        );
      }
    } catch (error) {
      handleApiError(error, "提交失败");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <section className="text-center py-6 mb-8">
        <h2 className="text-3xl font-bold mb-3 text-balance">
          Share Your <span className="text-primary">Glorious Failure</span>
        </h2>
        <p className="text-lg text-muted-foreground text-pretty max-w-2xl mx-auto">
          Turn your coding disasters into community entertainment. Every bug is
          a feature, every crash is a story, and every abandoned project is a
          badge of honor.
        </p>
      </section>

      <form className="space-y-6" onSubmit={handleSubmit}>
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Project Details</h2>
            </div>
            <p className="text-sm text-foreground-500">
              Tell us about your magnificent disaster
            </p>
          </CardHeader>
          <CardBody className="space-y-4">
            <Input
              isRequired
              description={`${formData.title.length}/100 字符`}
              label="项目名称 *"
              maxLength={100}
              placeholder="比如：AI食谱生成器只会做三明治"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
            />

            <Input
              isRequired
              description={`${formData.tagline.length}/60 字符`}
              label="一句话简介 *"
              maxLength={60}
              placeholder="比如：训练了10000个食谱，只输出PB&J变体"
              value={formData.tagline}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, tagline: e.target.value }))
              }
            />

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="failureType">
                失败类型
              </label>
              <FailureTypeSelector
                value={formData.failureType}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, failureType: value }))
                }
              />
            </div>
          </CardBody>
        </Card>

        {/* Confession */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">The Confession</h2>
            </div>
            <p className="text-sm text-foreground-500">
              Tell us the full story - what went wrong and why?
            </p>
          </CardHeader>
          <CardBody>
            <Textarea
              isRequired
              description={`诚实、有趣、详细。社区喜欢好的灾难故事。${formData.confession.length}/2000`}
              label="忏悔录 *"
              maxLength={2000}
              minRows={6}
              placeholder="我花了3个月训练一个食谱神经网络，结果发现它只学会了面包+馅料=食物。现在它建议47种不同的三明治做法..."
              value={formData.confession}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, confession: e.target.value }))
              }
            />
          </CardBody>
        </Card>

        {/* Tags */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">标签</h2>
            <p className="text-sm text-foreground-500">
              选择最多5个描述你失败的标签
            </p>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="flex gap-2">
              <Input
                className="flex-1"
                label="添加标签"
                placeholder="比如：React, TypeScript, 烂尾..."
                value={formData.currentTag}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    currentTag: e.target.value,
                  }))
                }
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <Button
                className="mt-2"
                isDisabled={
                  !formData.currentTag.trim() || formData.tags.length >= 5
                }
                type="button"
                variant="bordered"
                onClick={handleAddTag}
              >
                添加
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag) => (
                <Chip
                  key={tag}
                  color="primary"
                  variant="flat"
                  onClose={() => handleRemoveTag(tag)}
                >
                  {tag}
                </Chip>
              ))}
            </div>
            <p className="text-xs text-foreground-500">
              已选择: {formData.tags.length}/5
            </p>
          </CardBody>
        </Card>

        {/* Links */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">链接 (可选)</h2>
            <p className="text-sm text-foreground-500">
              如果你敢的话，分享你的项目和代码
            </p>
          </CardHeader>
          <CardBody className="space-y-4">
            <Input
              label="项目URL"
              placeholder="https://my-failed-project.com"
              type="url"
              value={formData.url}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, url: e.target.value }))
              }
            />
          </CardBody>
        </Card>

        {/* Logo Upload */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">项目Logo (可选)</h2>
            <p className="text-sm text-foreground-500">
              上传一个方形Logo (推荐64x64px)
            </p>
          </CardHeader>
          <CardBody>
            <ImageUpload
              images={formData.logoFiles}
              type="logo"
              onImagesChange={(files) =>
                setFormData((prev) => ({ ...prev, logoFiles: files }))
              }
            />
          </CardBody>
        </Card>

        {/* Gallery Upload */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">项目图片库 (可选)</h2>
            <p className="text-sm text-foreground-500">
              上传最多5张截图或图片来展示你的项目
            </p>
          </CardHeader>
          <CardBody>
            <ImageUpload
              images={formData.galleryFiles}
              type="gallery"
              onImagesChange={(files) =>
                setFormData((prev) => ({ ...prev, galleryFiles: files }))
              }
            />
          </CardBody>
        </Card>

        {/* Submit */}
        <Card>
          <CardBody className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
              <p className="text-sm text-foreground-500">
                提交即表示你同意让社区（带着爱意地）嘲笑你的代码。
              </p>
              <div className="flex gap-4 w-full sm:w-auto">
                <Button
                  className="flex-1 sm:flex-none"
                  size="lg"
                  variant="bordered"
                  onPress={() => router.push("/")}
                >
                  取消
                </Button>
                <Button
                  className="flex-1 sm:flex-none"
                  color="primary"
                  isDisabled={
                    !formData.title || !formData.tagline || !formData.confession
                  }
                  isLoading={isLoading}
                  size="lg"
                  type="submit"
                >
                  {isLoading ? "提交中..." : "提交我的失败"}
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      </form>
    </div>
  );
}
